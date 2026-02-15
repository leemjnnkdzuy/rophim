import {NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import Film from "@/app/models/Film";
import axios from "axios";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SERIES_FILTER = {"formats.name": "Phim bộ", public: true};

export async function GET(request: Request) {
	try {
		const {searchParams} = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "24");
		const skip = (page - 1) * limit;

		await connectDatabase();

		const currentYear = new Date().getFullYear();

		const [
			trendingSeries,
			newestByYear,
			recentlyUploaded,
			allSeries,
			totalCount,
		] = await Promise.all([
			// 1. 6 phim bộ thịnh hành
			Film.find(SERIES_FILTER).sort({views: -1}).limit(6).lean(),

			// 2. 6 phim bộ mới nhất theo năm
			Film.find({
				...SERIES_FILTER,
				"years.name": currentYear.toString(),
			})
				.sort({modified: -1})
				.limit(6)
				.lean()
				.then(async (results) => {
					if (results.length < 6) {
						const remaining = 6 - results.length;
						const existingSlugs = results.map((r) => r.slug);
						const moreSeries = await Film.find({
							...SERIES_FILTER,
							slug: {$nin: existingSlugs},
						})
							.sort({"years.name": -1, modified: -1})
							.limit(remaining)
							.lean();
						return [...results, ...moreSeries];
					}
					return results;
				}),

			// 3. 6 phim bộ mới upload
			Film.find(SERIES_FILTER).sort({modified: -1}).limit(6).lean(),

			// 4. Tất cả phim bộ phân trang
			Film.find(SERIES_FILTER)
				.sort({modified: -1})
				.skip(skip)
				.limit(limit)
				.lean(),

			// 5. Tổng số phim bộ
			Film.countDocuments(SERIES_FILTER),
		]);

		const totalPages = Math.ceil(totalCount / limit);

		// Helper: Gọi API ngoài để lấy current_episode cho 1 phim
		const fetchCurrentEpisode = async (
			slug: string,
		): Promise<string | null> => {
			try {
				const response = await axios.get(
					`https://phim.nguonc.com/api/film/${slug}`,
					{
						timeout: 3000,
					},
				);
				return response.data?.movie?.current_episode || null;
			} catch {
				return null;
			}
		};

		// Enrich: Gắn current_episode cho danh sách phim
		const enrichWithEpisode = async (movies: any[]) => {
			const results = await Promise.all(
				movies.map(async (movie) => {
					const currentEp = await fetchCurrentEpisode(movie.slug);
					return {...movie, current_episode: currentEp || undefined};
				}),
			);
			return results;
		};

		// Chỉ enrich cho các section nhỏ để đảm bảo hiệu năng
		const [
			enrichedTrending,
			enrichedNewest,
			enrichedRecently,
			enrichedAllSeries,
		] = await Promise.all([
			enrichWithEpisode(trendingSeries),
			enrichWithEpisode(newestByYear),
			enrichWithEpisode(recentlyUploaded),
			enrichWithEpisode(allSeries),
		]);

		return NextResponse.json(
			{
				trendingSeries: enrichedTrending,
				newestByYear: enrichedNewest,
				recentlyUploaded: enrichedRecently,
				allSeries: enrichedAllSeries,
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
					"Cache-Control": "no-store, no-cache, must-revalidate",
				},
			},
		);
	} catch (error) {
		console.error("Error fetching series:", error);
		return NextResponse.json(
			{message: "Error fetching series", error: (error as Error).message},
			{status: 500},
		);
	}
}
