import api from "@/app/utils/axios";

export interface FilmItem {
	_id: string;
	name: string;
	slug: string;
	poster_url: string;
	thumb_url: string;
	modified?: Date;
}

export interface CategoryCard {
	_id?: string;
	title: string;
	bgImage: string;
	href: string;
	color: string;
	order: number;
	filmSlugs: string[];
}

export interface HomeContentPayload {
	featuredFilmSlugs: string[];
	categoryCards: Array<{
		title: string;
		bgImage: string;
		href: string;
		color: string;
		order: number;
		filmSlugs: string[];
	}>;
}

export const buildHomeContentPayload = (
	films: FilmItem[],
	cards: CategoryCard[],
): HomeContentPayload => ({
	featuredFilmSlugs: films.map((f) => f.slug),
	categoryCards: cards.map((card, index) => ({
		title: card.title,
		bgImage: card.bgImage,
		href: card.href,
		color: card.color,
		order: index,
		filmSlugs: card.filmSlugs || [],
	})),
});

export const serializeHomeContentPayload = (payload: HomeContentPayload) =>
	JSON.stringify(payload);

/**
 * Fetch home content configuration from admin API
 */
export const fetchHomeContent = async (): Promise<{
	homeContent: {
		featuredFilms: FilmItem[];
		categoryCards: CategoryCard[];
	};
	success: boolean;
}> => {
	const res = await api.get("/admin/home-content");
	if (res.data.success) {
		const {homeContent} = res.data;
		const featuredFilms = homeContent.featuredFilms || [];
		const categoryCards = [...(homeContent.categoryCards || [])].sort(
			(a: CategoryCard, b: CategoryCard) => a.order - b.order,
		);

		return {
			homeContent: {
				featuredFilms,
				categoryCards,
			},
			success: true,
		};
	}
	throw new Error("Failed to fetch home content");
};

/**
 * Save home content configuration
 */
export const saveHomeContent = async (
	payload: HomeContentPayload,
): Promise<void> => {
	const res = await api.put("/admin/home-content", payload);
	if (!res.data.success) {
		throw new Error("Failed to save home content");
	}
};

/**
 * Search films for featured or category
 */
export const searchAdminFilms = async (
	query: string,
	limit: number = 10,
): Promise<FilmItem[]> => {
	if (!query.trim()) {
		return [];
	}

	const res = await api.get("/admin/films", {
		params: {search: query, limit},
	});
	return res.data.films || [];
};

/**
 * Search films by slug list
 */
export const searchFilmsBySlugs = async (
	slugs: string[],
	limit: number = 100,
): Promise<FilmItem[]> => {
	if (!slugs || slugs.length === 0) {
		return [];
	}

	const res = await api.get("/admin/films", {
		params: {
			slugs: slugs.join(","),
			limit,
		},
	});
	return res.data.films || [];
};

/**
 * Convert File to Base64
 */
export const imageToBase64 = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
	});
};
