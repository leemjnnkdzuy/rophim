import {NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import Film from "@/app/models/Film";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const {searchParams} = new URL(request.url);
		const genre = searchParams.get("genre");
		const country = searchParams.get("country");
		const year = searchParams.get("year");
		const format = searchParams.get("format");
		const sort = searchParams.get("sort") || "views"; // views, rating, latest
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "24");
		const skip = (page - 1) * limit;

		if (!genre && !country && !format && !year) {
			return NextResponse.json(
				{
					message: "At least one filter parameter is required",
					films: [],
				},
				{status: 400},
			);
		}

		await connectDatabase();

		// Build filter query
		const filter: Record<string, unknown> = {public: true};

		// Helper to split comma-separated strings
		const parseList = (val: string | null) =>
			val ?
				val
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean)
			:	[];

		const genreList = parseList(genre);
		if (genreList.length > 0) {
			// AND logic for Genres (Refine search)
			filter["genres.name"] = {$all: genreList};
		}

		const countryList = parseList(country);
		if (countryList.length > 0) {
			// OR logic for Countries
			filter["countries.name"] = {$in: countryList};
		}

		const yearList = parseList(year).filter((y) => y !== "Tất cả");
		if (yearList.length > 0) {
			// OR logic for Years
			filter["years.name"] = {$in: yearList};
		}

		const formatList = parseList(format);
		if (formatList.length > 0) {
			// OR logic for Formats
			filter["formats.name"] = {$in: formatList};
		}

		// Build sort query
		let sortQuery: Record<string, 1 | -1> = {};
		switch (sort) {
			case "rating":
				sortQuery = {rating: -1, views: -1};
				break;
			case "latest":
				sortQuery = {modified: -1};
				break;
			case "views":
			default:
				sortQuery = {views: -1, modified: -1};
				break;
		}

		const [films, totalCount] = await Promise.all([
			Film.find(filter).sort(sortQuery).skip(skip).limit(limit).lean(),
			Film.countDocuments(filter),
		]);

		const totalPages = Math.ceil(totalCount / limit);

		return NextResponse.json(
			{
				films,
				pagination: {
					page,
					limit,
					totalCount,
					totalPages,
					hasNext: page < totalPages,
					hasPrev: page > 1,
				},
			},
			{
				headers: {
					"Cache-Control":
						"public, s-maxage=120, stale-while-revalidate=300",
				},
			},
		);
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		console.error("[API] Error filtering films:", errorMessage);
		return NextResponse.json(
			{message: "Error filtering films", error: errorMessage, films: []},
			{status: 500},
		);
	}
}
