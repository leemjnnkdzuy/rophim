import {NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import Film from "@/app/models/Film";
import HomeContent from "@/app/models/HomeContent";
import axios from "axios";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Interface for lean Film documents
interface FilmDocument {
	slug: string;
	name: string;
	poster_url: string;
	thumb_url: string;
	modified: Date;
	public: boolean;
	[key: string]: unknown;
}

export async function GET() {
	try {
		await connectDatabase();

		// Lấy danh sách phim nổi bật do admin chọn
		const homeContent = await HomeContent.findOne()
			.select("featuredFilmSlugs")
			.lean();
		const adminSlugs = homeContent?.featuredFilmSlugs || [];

		// Lấy phim admin chọn trước
		let adminFeatured: FilmDocument[] = [];
		if (adminSlugs.length > 0) {
			const adminFilms = (await Film.find({
				slug: {$in: adminSlugs},
				public: true,
			}).lean()) as unknown as FilmDocument[];
			// Sắp xếp theo thứ tự admin đã chọn
			adminFeatured = adminSlugs
				.map((slug: string) =>
					adminFilms.find((f: FilmDocument) => f.slug === slug),
				)
				.filter((f): f is FilmDocument => f !== undefined);
		}

		// Auto-fill nếu chưa đủ 5 phim
		const remainingCount = 5 - adminFeatured.length;
		let autoFillMovies: FilmDocument[] = [];
		if (remainingCount > 0) {
			const excludeSlugs = adminFeatured.map((f: FilmDocument) => f.slug);
			autoFillMovies = (await Film.find({
				public: true,
				slug: {$nin: excludeSlugs},
			})
				.sort({modified: -1})
				.limit(remainingCount)
				.lean()) as unknown as FilmDocument[];
		}

		const latestMoviesCombined = [...adminFeatured, ...autoFillMovies];

		const [
			trendingMovies,
			chinaMovies,
			koreaMovies,
			westernMovies,
			seriesMovies,
			singleMovies,
			cartoonMovies,
		] = await Promise.all([
			// 2. 6 phim có view cao (Trending)
			Film.find({public: true}).sort({views: -1}).limit(6).lean(),

			// 3. 6 phim Trung Quốc mới
			Film.find({"countries.name": "Trung Quốc", public: true})
				.sort({modified: -1})
				.limit(6)
				.lean(),

			// 4. 6 phim Hàn Quốc mới
			Film.find({"countries.name": "Hàn Quốc", public: true})
				.sort({modified: -1})
				.limit(6)
				.lean(),

			// 5. 6 phim Âu Mỹ mới
			Film.find({
				"countries.name": {
					$in: [
						"Âu Mỹ",
						"Mỹ",
						"Anh",
						"Pháp",
						"Canada",
						"Đức",
						"Tây Ban Nha",
					],
				},
				public: true,
			})
				.sort({modified: -1})
				.limit(6)
				.lean(),

			// 6. 12 phim bộ mới (cho Hero UI)
			Film.find({"formats.name": "Phim bộ", public: true})
				.sort({modified: -1})
				.limit(6)
				.lean(),

			// 7. 15 phim lẻ mới
			Film.find({"formats.name": "Phim lẻ", public: true})
				.sort({modified: -1})
				.limit(15)
				.lean(),

			// 8. 10 phim hoạt hình mới (cho Split UI)
			Film.find({"genres.name": "Hoạt Hình", public: true})
				.sort({modified: -1})
				.limit(10)
				.lean(),
		]);

		// Helper: Gọi API ngoài để lấy current_episode cho 1 phim
		const fetchCurrentEpisode = async (
			slug: string,
		): Promise<string | null> => {
			try {
				const response = await axios.get(
					`https://phim.nguonc.com/api/film/${slug}`,
					{
						timeout: 5000, // timeout 5s
					},
				);
				return response.data?.movie?.current_episode || null;
			} catch {
				return null;
			}
		};

		// Enrich: Gắn current_episode cho danh sách phim
		const enrichWithEpisode = async (movies: unknown[]) => {
			const results = await Promise.all(
				movies.map(async (movie) => {
					const filmDoc = movie as FilmDocument;
					const currentEp = await fetchCurrentEpisode(filmDoc.slug);
					return {
						...filmDoc,
						current_episode: currentEp || undefined,
					};
				}),
			);
			return results;
		};

		const [
			enrichedLatestMovies,
			enrichedTrendingMovies,
			enrichedSeriesMovies,
			enrichedCartoonMovies,
			enrichedChinaMovies,
			enrichedKoreaMovies,
			enrichedWesternMovies,
			enrichedSingleMovies,
		] = await Promise.all([
			enrichWithEpisode(latestMoviesCombined),
			enrichWithEpisode(trendingMovies as unknown[]),
			enrichWithEpisode(seriesMovies as unknown[]),
			enrichWithEpisode(cartoonMovies as unknown[]),
			enrichWithEpisode(chinaMovies as unknown[]),
			enrichWithEpisode(koreaMovies as unknown[]),
			enrichWithEpisode(westernMovies as unknown[]),
			enrichWithEpisode(singleMovies as unknown[]),
		]);

		const films = {
			latestMovies: enrichedLatestMovies,
			trendingMovies: enrichedTrendingMovies,
			chinaMovies: enrichedChinaMovies,
			koreaMovies: enrichedKoreaMovies,
			westernMovies: enrichedWesternMovies,
			seriesMovies: enrichedSeriesMovies,
			singleMovies: enrichedSingleMovies,
			cartoonMovies: enrichedCartoonMovies,
		};

		return NextResponse.json(films, {
			headers: {
				"Cache-Control": "no-store, no-cache, must-revalidate",
			},
		});
	} catch (error) {
		console.error("Error fetching latest films:", error);
		return NextResponse.json(
			{
				message: "Error fetching latest films",
				error: (error as Error).message,
			},
			{status: 500},
		);
	}
}
