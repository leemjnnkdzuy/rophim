import { NextRequest, NextResponse } from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import Film from "@/app/models/Film";
import { verifyAdmin } from "@/app/utils/adminAuth";

// GET: Fetch film details by slug
// GET: Fetch film details by slug
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		// Verify admin access
		const authResult = await verifyAdmin(request);
		if (authResult.error) {
			return NextResponse.json(
				{ success: false, message: authResult.error },
				{ status: authResult.status },
			);
		}

		const { slug } = await params;

		if (!slug) {
			return NextResponse.json(
				{ success: false, message: "Slug phim không hợp lệ" },
				{ status: 400 },
			);
		}

		await connectDatabase();

		const localFilm = await Film.findOne({ slug }).lean();

		if (!localFilm) {
			return NextResponse.json(
				{ success: false, message: "Không tìm thấy phim" },
				{ status: 404 },
			);
		}

		// Fetch from external API to get latest episode info
		let externalData = null;
		try {
			const res = await fetch(`https://phim.nguonc.com/api/film/${slug}`, {
				next: { revalidate: 60 }, // Cache for 60 seconds
			});
			if (res.ok) {
				const json = await res.json();
				if (json.status === "success") {
					externalData = json.movie;
				}
			}
		} catch (error) {
			console.error("External API fetch error:", error);
			// Continue with local data only
		}

		// Transform data
		const transformedFilm = {
			_id: localFilm._id.toString(),
			name: localFilm.name,
			slug: localFilm.slug,
			original_name: localFilm.original_name || "",
			description: localFilm.description || "",
			poster_url: localFilm.poster_url || "",
			thumb_url: localFilm.thumb_url || "",
			type:
				localFilm.formats && localFilm.formats.length > 0 ?
					localFilm.formats[0].name.includes("bộ") ?
						"series"
						: "single"
					: "single",
			year:
				localFilm.years && localFilm.years.length > 0 ?
					parseInt(localFilm.years[0].name)
					: 0,
			genres:
				localFilm.genres && localFilm.genres.length > 0 ?
					localFilm.genres.map((g: { name: string }) => g.name)
					: [],
			countries:
				localFilm.countries && localFilm.countries.length > 0 ?
					localFilm.countries.map((c: { name: string }) => c.name)
					: [],
			director: localFilm.director || "",
			casts: localFilm.casts || "",
			quality: localFilm.quality || "",
			language: localFilm.language || "",
			time: localFilm.time || "",
			total_episodes: localFilm.total_episodes || 0,
			episode_current: externalData?.episode_current || "Full",
			rating: localFilm.rating || 0,
			views: localFilm.views || 0,
			public: localFilm.public !== undefined ? localFilm.public : true,
			created: localFilm.created || null,
			modified: localFilm.modified || null,
		};

		return NextResponse.json({
			success: true,
			film: transformedFilm,
		});
	} catch (error) {
		console.error("Admin film details fetch error:", error);
		return NextResponse.json(
			{ success: false, message: "Lỗi server. Vui lòng thử lại sau." },
			{ status: 500 },
		);
	}
}
