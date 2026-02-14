import {NextResponse} from "next/server";
import axios from "axios";
import connectDatabase from "@/app/utils/connectDB";
import Film from "@/app/models/Film";

export const dynamic = "force-dynamic";

function getErrorStatus(error: unknown): number {
	if (error instanceof axios.AxiosError) {
		return error.response?.status ?? 500;
	}
	return 500;
}

export async function GET(
	request: Request,
	{params}: {params: Promise<{slug: string}>},
) {
	try {
		const {slug} = await params;

		if (!slug) {
			return NextResponse.json(
				{message: "Slug is required"},
				{status: 400},
			);
		}

		// Try to connect DB, but don't fail if it's not available
		let localFilm = null;
		try {
			await connectDatabase();
			localFilm = await Film.findOne({slug}).lean();
		} catch (dbError) {
			console.warn(
				"[API] Database connection failed:",
				dbError instanceof Error ? dbError.message : String(dbError),
			);
			// Continue without local film data
		}

		// Fetch from external API
		let externalRes = null;
		try {
			externalRes = await axios.get(
				`https://phim.nguonc.com/api/film/${slug}`,
				{
					timeout: 10000,
				},
			);
		} catch (apiError) {
			console.error(
				"[API] External API error:",
				apiError instanceof Error ? apiError.message : String(apiError),
			);
		}

		if (
			externalRes?.data?.status === "success" &&
			externalRes?.data?.movie
		) {
			const movieData = externalRes.data.movie;

			// Gộp dữ liệu từ local DB
			if (localFilm) {
				movieData.rating = localFilm.rating || 0;
				movieData.views = localFilm.views || 0;
				movieData.is_featured = localFilm.is_featured || false;
			} else {
				movieData.rating = 0;
				movieData.views = 0;
				movieData.is_featured = false;
			}

			return NextResponse.json(
				{
					...externalRes.data,
					movie: movieData,
				},
				{
					headers: {
						"Cache-Control":
							"public, s-maxage=300, stale-while-revalidate=600",
					},
				},
			);
		}

		return NextResponse.json({message: "Film not found"}, {status: 404});
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		console.error(
			"[API] Unexpected error fetching film detail:",
			errorMessage,
		);
		return NextResponse.json(
			{message: "Error fetching film detail", error: errorMessage},
			{
				status: getErrorStatus(error),
			},
		);
	}
}
