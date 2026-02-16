import {NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import HomeContent from "@/app/models/HomeContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Lấy cấu hình nội dung trang chủ (public - không cần auth)
export async function GET() {
	try {
		await connectDatabase();

		const homeContent = await HomeContent.findOne()
			.select("featuredFilmSlugs categoryCards")
			.lean();

		if (!homeContent) {
			return NextResponse.json(
				{
					featuredFilmSlugs: [],
					categoryCards: [],
				},
				{
					headers: {
						"Cache-Control": "no-store, no-cache, must-revalidate",
					},
				},
			);
		}

		// Sort category cards by order
		const sortedCards = [...(homeContent.categoryCards || [])].sort(
			(a, b) => (a.order || 0) - (b.order || 0),
		);

		return NextResponse.json(
			{
				featuredFilmSlugs: homeContent.featuredFilmSlugs || [],
				categoryCards: sortedCards,
			},
			{
				headers: {
					"Cache-Control": "no-store, no-cache, must-revalidate",
				},
			},
		);
	} catch (error) {
		console.error("Error fetching home content:", error);
		return NextResponse.json(
			{
				featuredFilmSlugs: [],
				categoryCards: [],
			},
			{status: 500},
		);
	}
}
