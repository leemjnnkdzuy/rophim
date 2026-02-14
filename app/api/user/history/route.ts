import { NextRequest, NextResponse } from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import User from "@/app/models/User";
import Film from "@/app/models/Film";
import { verifyAccessToken } from "@/app/utils/jwt";

function getUserId(request: NextRequest): string | null {
	const accessToken = request.cookies.get("access_token")?.value;
	if (!accessToken) return null;
	const payload = verifyAccessToken(accessToken);
	return payload?.userId || null;
}

export async function GET(request: NextRequest) {
	try {
		const userId = getUserId(request);
		if (!userId) {
			return NextResponse.json(
				{ success: false, message: "Chưa đăng nhập" },
				{ status: 401 },
			);
		}

		await connectDatabase();

		const user = await User.findById(userId).select("watchHistory");
		if (!user) {
			return NextResponse.json(
				{ success: false, message: "Không tìm thấy người dùng" },
				{ status: 404 },
			);
		}

		const url = new URL(request.url);
		const slug = url.searchParams.get("slug");
		const history = user.watchHistory || [];

		// Return last watched episode for a specific film
		if (slug) {
			const entry = history.find((h) => h.filmSlug === slug);
			if (!entry) {
				return NextResponse.json({
					success: true,
					found: false,
					lastWatched: null,
				});
			}
			return NextResponse.json({
				success: true,
				found: true,
				lastWatched: {
					filmSlug: entry.filmSlug,
					episodeSlug: entry.episodeSlug,
					episodeName: entry.episodeName,
					serverIdx: entry.serverIdx,
					watchedAt: entry.watchedAt,
				},
			});
		}

		// Return full watch history sorted by most recent
		const sorted = [...history].sort(
			(a, b) =>
				new Date(b.watchedAt).getTime() -
				new Date(a.watchedAt).getTime(),
		);

		// Get unique film slugs (most recent entry per film)
		const seen = new Set<string>();
		const uniqueHistory = sorted.filter((h) => {
			if (seen.has(h.filmSlug)) return false;
			seen.add(h.filmSlug);
			return true;
		});

		if (uniqueHistory.length === 0) {
			return NextResponse.json({
				success: true,
				history: [],
				films: [],
			});
		}

		// Fetch film details from DB
		const filmSlugs = uniqueHistory.map((h) => h.filmSlug);
		const films = await Film.find({ slug: { $in: filmSlugs } }).lean();
		const filmMap = new Map(films.map((film) => [film.slug, film]));

		const enrichedHistory = uniqueHistory
			.map((h) => {
				const film = filmMap.get(h.filmSlug);
				if (!film) return null;
				return {
					filmSlug: h.filmSlug,
					episodeSlug: h.episodeSlug,
					episodeName: h.episodeName,
					serverIdx: h.serverIdx,
					watchedAt: h.watchedAt,
					film: {
						name: film.name,
						slug: film.slug,
						original_name: film.original_name,
						thumb_url: film.thumb_url,
						poster_url: film.poster_url,
						total_episodes: film.total_episodes,
						time: film.time,
						quality: film.quality,
						language: film.language,
						rating: film.rating,
						views: film.views,
						genres: film.genres,
						years: film.years,
					},
				};
			})
			.filter(Boolean);

		return NextResponse.json({
			success: true,
			history: enrichedHistory,
		});
	} catch (error) {
		console.error("Watch history GET error:", error);
		return NextResponse.json(
			{ success: false, message: "Lỗi server. Vui lòng thử lại sau." },
			{ status: 500 },
		);
	}
}

// POST: Update watch history (track episode watched)
export async function POST(request: NextRequest) {
	try {
		const userId = getUserId(request);
		if (!userId) {
			return NextResponse.json(
				{ success: false, message: "Chưa đăng nhập" },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const { filmSlug, episodeSlug, episodeName, serverIdx } = body;

		if (!filmSlug || !episodeSlug) {
			return NextResponse.json(
				{ success: false, message: "Thiếu thông tin phim hoặc tập phim" },
				{ status: 400 },
			);
		}

		await connectDatabase();

		const user = await User.findById(userId).select("watchHistory");
		if (!user) {
			return NextResponse.json(
				{ success: false, message: "Không tìm thấy người dùng" },
				{ status: 404 },
			);
		}

		// Remove existing entry for this film (we only keep latest per film)
		user.watchHistory = (user.watchHistory || []).filter(
			(h) => h.filmSlug !== filmSlug,
		);

		// Add new entry at the beginning
		user.watchHistory.unshift({
			filmSlug: String(filmSlug).trim(),
			episodeSlug: String(episodeSlug).trim(),
			episodeName: String(episodeName || "").trim(),
			serverIdx: Number(serverIdx) || 0,
			watchedAt: new Date(),
		});

		// Limit history to 100 films max
		if (user.watchHistory.length > 100) {
			user.watchHistory = user.watchHistory.slice(0, 100);
		}

		await user.save();

		return NextResponse.json({
			success: true,
			lastWatched: {
				filmSlug,
				episodeSlug,
				episodeName,
				serverIdx: Number(serverIdx) || 0,
			},
		});
	} catch (error) {
		console.error("Watch history POST error:", error);
		return NextResponse.json(
			{ success: false, message: "Lỗi server. Vui lòng thử lại sau." },
			{ status: 500 },
		);
	}
}
