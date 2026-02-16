import api from "@/app/utils/axios";

export interface MovieItem {
	name: string;
	slug: string;
	original_name: string;
	thumb_url: string;
	poster_url: string;
	created: string;
	modified: string;
	description: string;
	total_episodes: number;
	current_episode: string;
	time: string | null;
	quality: string;
	language: string;
	director: string | null;
	casts: string | null;
	formats?: {id: string; name: string}[];
	genres?: {id: string; name: string}[];
	years?: {id: string; name: string}[];
	countries?: {id: string; name: string}[];
}

export interface GenreItem {
	id: string;
	name: string;
}

export interface CountryItem {
	id: string;
	name: string;
}

export interface YearItem {
	id: string;
	name: string;
}

export interface FormatItem {
	id: string;
	name: string;
}

/**
 * Fetch basic filter options: formats, genres, countries, years
 */
export const fetchFilterOptions = async (): Promise<{
	formats: FormatItem[];
	genres: GenreItem[];
	countries: CountryItem[];
	years: YearItem[];
}> => {
	try {
		const [formatsRes, genresRes, countriesRes, yearsRes] =
			await Promise.all([
				api.get("/formats"),
				api.get("/genres"),
				api.get("/countries"),
				api.get("/years"),
			]);

		return {
			formats:
				Array.isArray(formatsRes.data) ?
					formatsRes.data.filter(Boolean)
				:	[],
			genres:
				Array.isArray(genresRes.data) ?
					genresRes.data.filter(Boolean)
				:	[],
			countries:
				Array.isArray(countriesRes.data) ?
					countriesRes.data.filter(Boolean)
				:	[],
			years: Array.isArray(yearsRes.data) ? yearsRes.data : [],
		};
	} catch (error) {
		console.error("Failed to fetch filter options:", error);
		throw error;
	}
};

/**
 * Fetch genres list
 */
export const fetchGenres = async (): Promise<GenreItem[]> => {
	try {
		const res = await api.get("/genres");
		return Array.isArray(res.data) ? res.data.filter(Boolean) : [];
	} catch (error) {
		console.error("Failed to fetch genres:", error);
		return [];
	}
};

/**
 * Fetch countries list
 */
export const fetchCountries = async (): Promise<CountryItem[]> => {
	try {
		const res = await api.get("/countries");
		return Array.isArray(res.data) ? res.data.filter(Boolean) : [];
	} catch (error) {
		console.error("Failed to fetch countries:", error);
		return [];
	}
};

/**
 * Fetch years list
 */
export const fetchYears = async (): Promise<YearItem[]> => {
	try {
		const res = await api.get("/years");
		return Array.isArray(res.data) ? res.data : [];
	} catch (error) {
		console.error("Failed to fetch years:", error);
		return [];
	}
};

/**
 * Filter films by multiple criteria using /films/filter endpoint
 * Used by GenresFilterPage and CountriesFilterPage
 */
export const filterFilms = async (params: {
	genre?: string;
	country?: string;
	year?: string;
	format?: string;
	sort?: string;
	page?: number;
	limit?: number;
}): Promise<{
	films: MovieItem[];
	pagination: {
		page: number;
		limit: number;
		totalCount: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}> => {
	try {
		const res = await api.get("/films/filter", {params});
		return {
			films: res.data.films || [],
			pagination: res.data.pagination || {
				page: params.page || 1,
				limit: params.limit || 24,
				totalCount: 0,
				totalPages: 1,
				hasNext: false,
				hasPrev: false,
			},
		};
	} catch (error) {
		console.error("Failed to filter films:", error);
		throw error;
	}
};

/**
 * Search films by text query using /films/search endpoint
 * Used by SearchPage
 */
export const searchFilms = async (params: {
	q?: string;
	genre?: string;
	country?: string;
	year?: string;
	format?: string;
	sort?: string;
	page?: number;
	limit?: number;
}): Promise<{
	films: MovieItem[];
	pagination: {
		page: number;
		limit: number;
		totalCount: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}> => {
	try {
		const res = await api.get("/films/search", {params});
		return {
			films: res.data.films || [],
			pagination: res.data.pagination || {
				page: params.page || 1,
				limit: params.limit || 24,
				totalCount: 0,
				totalPages: 1,
				hasNext: false,
				hasPrev: false,
			},
		};
	} catch (error) {
		console.error("Failed to search films:", error);
		throw error;
	}
};

/**
 * Search films by genre and filters (alias for backwards compatibility)
 */
export const searchFilmsByGenre = async (params: {
	genre?: string;
	country?: string;
	year?: string;
	format?: string;
	search?: string;
	page?: number;
	limit?: number;
}): Promise<{
	films: MovieItem[];
	pagination: {
		page: number;
		limit: number;
		totalCount: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}> => {
	try {
		const res = await api.get("/films/search", {params});
		return {
			films: res.data.films || [],
			pagination: res.data.pagination || {
				page: 1,
				limit: 24,
				totalCount: 0,
				totalPages: 1,
				hasNext: false,
				hasPrev: false,
			},
		};
	} catch (error) {
		console.error("Failed to search films:", error);
		throw error;
	}
};
