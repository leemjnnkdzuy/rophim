import {NextRequest, NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import User from "@/app/models/User";
import Film from "@/app/models/Film";
import {verifyAccessToken} from "@/app/utils/jwt";
import axios from "axios";

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
				{success: false, message: "Chưa đăng nhập"},
				{status: 401},
			);
		}

		await connectDatabase();

		const user = await User.findById(userId).select("savedFilms");
		if (!user) {
			return NextResponse.json(
				{success: false, message: "Không tìm thấy người dùng"},
				{status: 404},
			);
		}

		const url = new URL(request.url);
		const slug = url.searchParams.get("slug");
		const savedFilms = user.savedFilms || [];

		if (slug) {
			return NextResponse.json({
				success: true,
				isSaved: savedFilms.includes(slug),
			});
		}

		if (savedFilms.length === 0) {
			return NextResponse.json({success: true, slugs: [], films: []});
		}

		const films = await Film.find({slug: {$in: savedFilms}}).lean();
		const filmMap = new Map(films.map((film) => [film.slug, film]));
		const orderedFilms = savedFilms
			.map((filmSlug) => filmMap.get(filmSlug))
			.filter((film): film is NonNullable<typeof film> => Boolean(film));

		const fetchCurrentEpisode = async (filmSlug: string) => {
			try {
				const response = await axios.get(
					`https://phim.nguonc.com/api/film/${filmSlug}`,
					{timeout: 5000},
				);
				return response.data?.movie?.current_episode || null;
			} catch {
				return null;
			}
		};

		const enrichedFilms = await Promise.all(
			orderedFilms.map(async (film) => {
				const currentEpisode = await fetchCurrentEpisode(film.slug);
				return {
					...film,
					current_episode: currentEpisode,
				};
			}),
		);

		return NextResponse.json({
			success: true,
			slugs: savedFilms,
			films: enrichedFilms,
		});
	} catch (error) {
		console.error("Saved films error:", error);
		return NextResponse.json(
			{success: false, message: "Lỗi server. Vui lòng thử lại sau."},
			{status: 500},
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const userId = getUserId(request);
		if (!userId) {
			return NextResponse.json(
				{success: false, message: "Chưa đăng nhập"},
				{status: 401},
			);
		}

		const body = await request.json();
		const {slug, action} = body;

		if (!slug) {
			return NextResponse.json(
				{success: false, message: "Thiếu slug phim"},
				{status: 400},
			);
		}

		await connectDatabase();

		const user = await User.findById(userId).select("savedFilms");
		if (!user) {
			return NextResponse.json(
				{success: false, message: "Không tìm thấy người dùng"},
				{status: 404},
			);
		}

		const normalizedSlug = String(slug).trim();
		const savedSet = new Set(user.savedFilms || []);
		const normalizedAction = String(action || "toggle").toLowerCase();

		let isSaved = false;

		if (normalizedAction === "add") {
			savedSet.add(normalizedSlug);
			isSaved = true;
		} else if (normalizedAction === "remove") {
			savedSet.delete(normalizedSlug);
			isSaved = false;
		} else {
			if (savedSet.has(normalizedSlug)) {
				savedSet.delete(normalizedSlug);
				isSaved = false;
			} else {
				savedSet.add(normalizedSlug);
				isSaved = true;
			}
		}

		user.savedFilms = Array.from(savedSet);
		await user.save();

		return NextResponse.json({
			success: true,
			isSaved,
			savedCount: user.savedFilms.length,
		});
	} catch (error) {
		console.error("Update saved films error:", error);
		return NextResponse.json(
			{success: false, message: "Lỗi server. Vui lòng thử lại sau."},
			{status: 500},
		);
	}
}
