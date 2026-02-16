import {NextRequest, NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import HomeContent from "@/app/models/HomeContent";
import Film from "@/app/models/Film";
import {verifyAdmin} from "@/app/utils/adminAuth";

export const dynamic = "force-dynamic";

// GET: Lấy cấu hình nội dung trang chủ
export async function GET(request: NextRequest) {
	try {
		const authResult = await verifyAdmin(request);
		if (authResult.error) {
			return NextResponse.json(
				{success: false, message: authResult.error},
				{status: authResult.status},
			);
		}

		await connectDatabase();

		// Lấy hoặc tạo document singleton
		let homeContent = await HomeContent.findOne().lean();
		if (!homeContent) {
			const newContent = await HomeContent.create({
				featuredFilmSlugs: [],
				categoryCards: [],
			});
			homeContent = newContent.toObject();
		}

		// Lấy thông tin chi tiết các phim featured
		interface FilmInfo {
			slug: string;
			name: string;
			poster_url: string;
			thumb_url: string;
			modified: Date;
		}
		let featuredFilms: FilmInfo[] = [];
		if (
			homeContent.featuredFilmSlugs &&
			homeContent.featuredFilmSlugs.length > 0
		) {
			featuredFilms = (await Film.find({
				slug: {$in: homeContent.featuredFilmSlugs},
			})
				.select("name slug poster_url thumb_url modified")
				.lean()) as FilmInfo[];

			// Sắp xếp theo thứ tự admin đã chọn
			const slugOrder = homeContent.featuredFilmSlugs;
			featuredFilms.sort(
				(a: FilmInfo, b: FilmInfo) =>
					slugOrder.indexOf(a.slug) - slugOrder.indexOf(b.slug),
			);
		}

		return NextResponse.json({
			success: true,
			homeContent: {
				...homeContent,
				featuredFilms,
			},
		});
	} catch (error) {
		console.error("Error fetching home content:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Lỗi khi tải cấu hình trang chủ",
				error: (error as Error).message,
			},
			{status: 500},
		);
	}
}

// PUT: Cập nhật cấu hình nội dung trang chủ
export async function PUT(request: NextRequest) {
	try {
		const authResult = await verifyAdmin(request);
		if (authResult.error) {
			return NextResponse.json(
				{success: false, message: authResult.error},
				{status: authResult.status},
			);
		}

		await connectDatabase();

		const body = await request.json();
		const {featuredFilmSlugs, categoryCards} = body;

		// Validate
		if (featuredFilmSlugs && featuredFilmSlugs.length > 5) {
			return NextResponse.json(
				{success: false, message: "Tối đa 5 phim nổi bật"},
				{status: 400},
			);
		}

		if (categoryCards && categoryCards.length > 6) {
			return NextResponse.json(
				{success: false, message: "Tối đa 6 thẻ danh mục"},
				{status: 400},
			);
		}

		// Validate base64 image size (max 2MB per image)
		if (categoryCards) {
			for (const card of categoryCards) {
				if (card.bgImage && card.bgImage.length > 2 * 1024 * 1024) {
					return NextResponse.json(
						{
							success: false,
							message: `Ảnh nền "${card.title}" vượt quá 2MB`,
						},
						{status: 400},
					);
				}
			}
		}

		// Upsert: Tạo hoặc cập nhật document singleton
		const updateData: Record<string, unknown> = {};
		if (featuredFilmSlugs !== undefined) {
			updateData.featuredFilmSlugs = featuredFilmSlugs;
		}
		if (categoryCards !== undefined) {
			updateData.categoryCards = categoryCards;
		}

		const homeContent = await HomeContent.findOneAndUpdate(
			{},
			{$set: updateData},
			{upsert: true, new: true, runValidators: true},
		);

		// Auto-fix href for each category card to use real MongoDB _id
		if (homeContent && homeContent.categoryCards) {
			let needsUpdate = false;
			for (const card of homeContent.categoryCards) {
				const correctHref = `/danh-muc/${card._id}`;
				if (card.href !== correctHref) {
					card.href = correctHref;
					needsUpdate = true;
				}
			}
			if (needsUpdate) {
				await homeContent.save();
			}
		}

		const result = homeContent ? homeContent.toObject() : null;

		return NextResponse.json({
			success: true,
			message: "Cập nhật thành công",
			homeContent: result,
		});
	} catch (error) {
		console.error("Error updating home content:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Lỗi khi cập nhật cấu hình trang chủ",
				error: (error as Error).message,
			},
			{status: 500},
		);
	}
}
