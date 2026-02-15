import {NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import Film from "@/app/models/Film";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SINGLE_MOVIE_FILTER = {"formats.name": "Phim lẻ", public: true};

export async function GET(request: Request) {
	try {
		const {searchParams} = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "24");
		const skip = (page - 1) * limit;

		await connectDatabase();

		const currentYear = new Date().getFullYear();

		const [
			trendingMovies,
			newestByYear,
			recentlyUploaded,
			allMovies,
			totalCount,
		] = await Promise.all([
			// 1. 6 phim lẻ thịnh hành (views cao nhất)
			Film.find(SINGLE_MOVIE_FILTER).sort({views: -1}).limit(6).lean(),

			// 2. 6 phim lẻ mới nhất theo năm (year mới nhất)
			Film.find({
				...SINGLE_MOVIE_FILTER,
				"years.name": currentYear.toString(),
			})
				.sort({modified: -1})
				.limit(6)
				.lean()
				.then(async (results) => {
					// Nếu không đủ 6 phim năm hiện tại, bổ sung năm trước
					if (results.length < 6) {
						const remaining = 6 - results.length;
						const existingSlugs = results.map((r) => r.slug);
						const moreMovies = await Film.find({
							...SINGLE_MOVIE_FILTER,
							slug: {$nin: existingSlugs},
						})
							.sort({"years.name": -1, modified: -1})
							.limit(remaining)
							.lean();
						return [...results, ...moreMovies];
					}
					return results;
				}),

			// 3. 6 phim lẻ mới upload (theo modified mới nhất)
			Film.find(SINGLE_MOVIE_FILTER).sort({modified: -1}).limit(6).lean(),

			// 4. Tất cả phim lẻ phân trang
			Film.find(SINGLE_MOVIE_FILTER)
				.sort({modified: -1})
				.skip(skip)
				.limit(limit)
				.lean(),

			// 5. Tổng số phim lẻ (cho phân trang)
			Film.countDocuments(SINGLE_MOVIE_FILTER),
		]);

		const totalPages = Math.ceil(totalCount / limit);

		return NextResponse.json(
			{
				trendingMovies,
				newestByYear,
				recentlyUploaded,
				allMovies,
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
		console.error("Error fetching single movies:", error);
		return NextResponse.json(
			{
				message: "Error fetching single movies",
				error: (error as Error).message,
			},
			{status: 500},
		);
	}
}
