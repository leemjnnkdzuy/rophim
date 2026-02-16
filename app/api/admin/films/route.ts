import {NextRequest, NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import Film from "@/app/models/Film";
import {verifyAdmin} from "@/app/utils/adminAuth";

// GET: Fetch all films with pagination and search
export async function GET(request: NextRequest) {
	try {
		// Verify admin access
		const authResult = await verifyAdmin(request);
		if (authResult.error) {
			return NextResponse.json(
				{success: false, message: authResult.error},
				{status: authResult.status},
			);
		}

		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "20");
		const search = url.searchParams.get("search") || "";
		const slugs = url.searchParams.get("slugs") || "";

		await connectDatabase();

		const skip = (page - 1) * limit;

		// Build search query
		const query: Record<string, unknown> = {};
		if (slugs) {
			// Filter by specific slugs
			const slugList = slugs.split(",").filter(Boolean);
			query.slug = {$in: slugList};
		} else if (search) {
			query.$or = [
				{name: {$regex: search, $options: "i"}},
				{original_name: {$regex: search, $options: "i"}},
				{slug: {$regex: search, $options: "i"}},
			];
		}

		// Fetch films with pagination
		const films = await Film.find(query)
			.select(
				"name slug original_name poster_url thumb_url formats years views rating public created",
			)
			.sort({modified: -1})
			.skip(skip)
			.limit(limit)
			.lean();

		const totalFilms = await Film.countDocuments(query);
		const totalPages = Math.ceil(totalFilms / limit);

		// Transform data
		const transformedFilms = films.map((film) => ({
			_id: film._id.toString(),
			name: film.name,
			slug: film.slug,
			origin_name: film.original_name || "",
			poster_url: film.poster_url || "",
			thumb_url: film.thumb_url || "",
			type:
				film.formats && film.formats.length > 0 ?
					film.formats[0].name.includes("bộ") ?
						"series"
					:	"single"
				:	"single",
			status: "completed",
			episode_current: "",
			year:
				film.years && film.years.length > 0 ?
					parseInt(film.years[0].name)
				:	0,
			view: film.views || 0,
			rating: film.rating || 0,
			public: film.public !== undefined ? film.public : true,
			createdAt: film.created || null,
		}));

		return NextResponse.json({
			success: true,
			films: transformedFilms,
			total: totalFilms,
			page,
			totalPages,
		});
	} catch (error) {
		console.error("Admin films fetch error:", error);
		return NextResponse.json(
			{success: false, message: "Lỗi server. Vui lòng thử lại sau."},
			{status: 500},
		);
	}
}

// PATCH: Update film public status
export async function PATCH(request: NextRequest) {
	try {
		// Verify admin access
		const authResult = await verifyAdmin(request);
		if (authResult.error) {
			return NextResponse.json(
				{success: false, message: authResult.error},
				{status: authResult.status},
			);
		}

		const body = await request.json();
		const {filmId, public: isPublic} = body;

		if (!filmId || typeof isPublic !== "boolean") {
			return NextResponse.json(
				{success: false, message: "Dữ liệu không hợp lệ"},
				{status: 400},
			);
		}

		await connectDatabase();

		// Update film public status
		const updatedFilm = await Film.findByIdAndUpdate(
			filmId,
			{public: isPublic},
			{new: true, returnDocument: "after"},
		).select("_id slug public");

		if (!updatedFilm) {
			return NextResponse.json(
				{success: false, message: "Không tìm thấy phim"},
				{status: 404},
			);
		}

		return NextResponse.json({
			success: true,
			message: `Đã ${isPublic ? "công khai" : "ẩn"} phim thành công`,
			film: {
				_id: updatedFilm._id.toString(),
				slug: updatedFilm.slug,
				public: updatedFilm.public,
			},
		});
	} catch (error) {
		console.error("Admin film update error:", error);
		return NextResponse.json(
			{success: false, message: "Lỗi server. Vui lòng thử lại sau."},
			{status: 500},
		);
	}
}
