import {NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import Film from "@/app/models/Film";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const {searchParams} = new URL(request.url);
		const query = searchParams.get("q") || searchParams.get("search");
		const limit = parseInt(searchParams.get("limit") || "50");

		if (!query || query.trim().length === 0) {
			return NextResponse.json(
				{message: "Search query is required", films: []},
				{status: 400},
			);
		}

		await connectDatabase();

		// Create a case-insensitive regex search
		const searchRegex = new RegExp(query.trim(), "i");

		// Search in multiple fields
		const films = await Film.find({
			$or: [
				{name: searchRegex},
				{original_name: searchRegex},
				{description: searchRegex},
				{director: searchRegex},
				{casts: searchRegex},
			],
		})
			.sort({views: -1, modified: -1}) // Sort by views first, then by modified date
			.limit(limit)
			.lean();

		return NextResponse.json(
			{
				films,
				total: films.length,
				query: query.trim(),
			},
			{
				headers: {
					"Cache-Control":
						"public, s-maxage=60, stale-while-revalidate=120",
				},
			},
		);
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		console.error("[API] Error searching films:", errorMessage);
		return NextResponse.json(
			{message: "Error searching films", error: errorMessage, films: []},
			{status: 500},
		);
	}
}
