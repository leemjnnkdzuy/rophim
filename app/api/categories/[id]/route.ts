import {NextRequest, NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import HomeContent from "@/app/models/HomeContent";
import Film from "@/app/models/Film";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Lấy thông tin danh mục theo ID
export async function GET(
	request: NextRequest,
	{params}: {params: Promise<{id: string}>},
) {
	try {
		await connectDatabase();

		const {id} = await params;

		// Validate ID format
		if (!id || id.length !== 24) {
			return NextResponse.json(
				{
					success: false,
					message: "ID danh mục không hợp lệ",
				},
				{status: 400},
			);
		}

		// Find the home content document
		const homeContent = await HomeContent.findOne().lean();

		if (!homeContent || !homeContent.categoryCards) {
			return NextResponse.json(
				{
					success: false,
					message: "Không tìm thấy danh mục",
				},
				{status: 404},
			);
		}

		// Find the specific category card by _id
		const category = homeContent.categoryCards.find(
			(card) => card._id?.toString() === id,
		);

		if (!category) {
			return NextResponse.json(
				{
					success: false,
					message: "Không tìm thấy danh mục",
				},
				{status: 404},
			);
		}

		// Fetch films for this category
		const filmsData = (await Film.find({
			slug: {$in: category.filmSlugs || []},
		})
			.select(
				"name slug original_name thumb_url poster_url quality language total_episodes time years modified",
			)
			.lean()) as unknown as {
			_id: string;
			name: string;
			slug: string;
			original_name: string;
			thumb_url: string;
			poster_url: string;
			quality: string;
			language: string;
			total_episodes: number;
			time: string;
			years: Array<{id: string; name: string}>;
			modified: Date;
		}[];

		// Sort films by the order in filmSlugs
		if (category.filmSlugs && category.filmSlugs.length > 0) {
			const slugOrder = category.filmSlugs;
			filmsData.sort((a, b) => {
				const indexA = slugOrder.indexOf(a.slug);
				const indexB = slugOrder.indexOf(b.slug);
				return indexA - indexB;
			});
		}

		return NextResponse.json(
			{
				success: true,
				category: {
					_id: category._id,
					title: category.title,
					bgImage: category.bgImage,
					href: category.href,
					color: category.color,
					order: category.order,
				},
				films: filmsData,
				totalFilms: filmsData.length,
			},
			{
				headers: {
					"Cache-Control": "no-store, no-cache, must-revalidate",
				},
			},
		);
	} catch (error) {
		console.error("Error fetching category:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Lỗi khi tải danh mục",
				error: (error as Error).message,
			},
			{status: 500},
		);
	}
}
