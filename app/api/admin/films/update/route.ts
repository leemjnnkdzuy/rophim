import { NextRequest, NextResponse } from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import User from "@/app/models/User";
import Film, { ICategoryItem } from "@/app/models/Film";
import { verifyAccessToken } from "@/app/utils/jwt";

// Middleware to verify admin access
async function verifyAdmin(request: NextRequest) {
	const accessToken = request.cookies.get("access_token")?.value;

	if (!accessToken) {
		return { error: "Không tìm thấy token", status: 401 };
	}

	const payload = verifyAccessToken(accessToken);
	if (!payload) {
		return { error: "Token không hợp lệ hoặc đã hết hạn", status: 401 };
	}

	await connectDatabase();

	const user = await User.findById(payload.userId).select("role");
	if (!user) {
		return { error: "Không tìm thấy người dùng", status: 404 };
	}

	if (user.role !== "admin") {
		return { error: "Không có quyền truy cập", status: 403 };
	}

	return { user, error: null };
}

// Helper functions
async function fetchWithRetry(
	url: string,
	retries: number = 3,
): Promise<unknown> {
	for (let i = 0; i < retries; i++) {
		try {
			const response = await fetch(url, {
				next: { revalidate: 0 },
			});
			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}`,
				);
			}
			return await response.json();
		} catch (error) {
			if (i === retries - 1) throw error;
			await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
		}
	}
}

function parseCategories(category: Record<string, unknown>): {
	formats: ICategoryItem[];
	genres: ICategoryItem[];
	years: ICategoryItem[];
	countries: ICategoryItem[];
} {
	const result = {
		formats: [] as ICategoryItem[],
		genres: [] as ICategoryItem[],
		years: [] as ICategoryItem[],
		countries: [] as ICategoryItem[],
	};

	if (!category) return result;

	for (const key of Object.keys(category)) {
		const group = category[key] as Record<string, unknown>;
		const groupName = (group?.group as Record<string, unknown>)
			?.name as string;
		const list: ICategoryItem[] = ((group?.list as unknown[]) || []).map(
			(item: unknown) => {
				const i = item as Record<string, string>;
				return {
					id: i.id,
					name: i.name,
				};
			},
		);

		switch (groupName) {
			case "Định dạng":
				result.formats = list;
				break;
			case "Thể loại":
				result.genres = list;
				break;
			case "Năm":
				result.years = list;
				break;
			case "Quốc gia":
				result.countries = list;
				break;
		}
	}

	return result;
}

async function fetchFilmDetail(slug: string): Promise<unknown> {
	const url = `https://phim.nguonc.com/api/film/${slug}`;
	const data = (await fetchWithRetry(url)) as Record<string, unknown>;
	return data.movie || null;
}

// POST: Update films from external API
export async function POST(request: NextRequest) {
	try {
		// Verify admin access
		const authResult = await verifyAdmin(request);
		if (authResult.error) {
			return NextResponse.json(
				{ success: false, message: authResult.error },
				{ status: authResult.status },
			);
		}

		await connectDatabase();

		// Get the latest film in DB to know when to stop crawling
		const latestFilm = await Film.findOne()
			.sort({ modified: -1 })
			.select("slug modified")
			.lean();

		const latestSlug = latestFilm?.slug;
		const latestModified = latestFilm?.modified;

		const BASE_URL = "https://phim.nguonc.com/api/films/phim-moi-cap-nhat";
		const newFilms: {
			name: string;
			slug: string;
			poster_url: string;
			modified?: Date;
		}[] = [];
		let currentPage = 1;
		let shouldContinue = true;

		while (shouldContinue) {
			try {
				const url = `${BASE_URL}?page=${currentPage}`;
				const data = (await fetchWithRetry(url)) as Record<
					string,
					unknown
				>;
				const items = (data.items as unknown[]) || [];

				if (items.length === 0) {
					break; // No more films
				}

				// Process each film in the current page
				for (const item of items) {
					const listItem = item as Record<string, unknown>;
					const slug = listItem.slug as string;
					const modified =
						listItem.modified ?
							new Date(listItem.modified as string)
							: null;

					// Stop if we encounter a film that already exists and is not newer
					if (slug === latestSlug) {
						shouldContinue = false;
						break;
					}

					// Also stop if modified date is older than or equal to latest in DB
					if (
						latestModified &&
						modified &&
						modified <= latestModified
					) {
						shouldContinue = false;
						break;
					}

					// Check if film already exists in DB
					const existingFilm = await Film.findOne({ slug }).lean();

					// Skip if film exists and modified date is not newer
					if (existingFilm) {
						if (
							modified &&
							existingFilm.modified &&
							modified <= existingFilm.modified
						) {
							continue; // Skip this film
						}
					}

					// Fetch detail to get categories
					const detail = (await fetchFilmDetail(slug)) as Record<
						string,
						unknown
					> | null;
					const categories =
						detail ?
							parseCategories(
								detail.category as Record<string, unknown>,
							)
							: {
								formats: [],
								genres: [],
								years: [],
								countries: [],
							};

					// Prepare film data
					const filmData = {
						name: listItem.name as string,
						slug: listItem.slug as string,
						original_name: (listItem.original_name as string) || "",
						description: (listItem.description as string) || "",
						thumb_url: (listItem.thumb_url as string) || "",
						poster_url: (listItem.poster_url as string) || "",
						created:
							listItem.created ?
								new Date(listItem.created as string)
								: undefined,
						modified:
							listItem.modified ?
								new Date(listItem.modified as string)
								: undefined,
						total_episodes:
							(listItem.total_episodes as number) || 0,
						time: (listItem.time as string) || "",
						quality: (listItem.quality as string) || "",
						language: (listItem.language as string) || "",
						director: (listItem.director as string) || "",
						casts: (listItem.casts as string) || "",
						formats: categories.formats,
						genres: categories.genres,
						years: categories.years,
						countries: categories.countries,
					};

					// Upsert film
					await Film.findOneAndUpdate(
						{ slug: filmData.slug },
						{ $set: filmData },
						{ upsert: true, new: true },
					);

					newFilms.push({
						name: filmData.name,
						slug: filmData.slug,
						poster_url: filmData.poster_url,
						modified: filmData.modified,
					});

					// Small delay to avoid rate limiting
					await new Promise((resolve) => setTimeout(resolve, 100));
				}

				if (!shouldContinue) break;

				currentPage++;

				// Safety limit: stop after 10 pages
				if (currentPage > 10) {
					break;
				}

				// Delay between pages
				await new Promise((resolve) => setTimeout(resolve, 500));
			} catch (error) {
				console.error(`Error fetching page ${currentPage}:`, error);
				break; // Stop on error
			}
		}

		return NextResponse.json({
			success: true,
			message: `Đã cập nhật ${newFilms.length} phim mới`,
			films: newFilms,
			totalPages: currentPage - 1,
		});
	} catch (error) {
		console.error("Admin films update error:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Lỗi server. Vui lòng thử lại sau.",
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
