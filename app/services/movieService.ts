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

export interface CategoryCard {
	_id: string;
	title: string;
	bgImage: string;
	href: string;
	color: string;
	order: number;
}

export interface HomeContentData {
	featuredFilmSlugs: string[];
	categoryCards: CategoryCard[];
}

export interface CategoryMovies {
	latestMovies: MovieItem[];
	trendingMovies: MovieItem[];
	chinaMovies: MovieItem[];
	koreaMovies: MovieItem[];
	westernMovies: MovieItem[];
	seriesMovies: MovieItem[];
	singleMovies: MovieItem[];
	cartoonMovies: MovieItem[];
	allGenres: string[];
	homeContent?: HomeContentData;
}

import api from "@/app/utils/axios";
import {AxiosError} from "axios";

function getErrorMessage(error: unknown): string {
	if (error instanceof AxiosError) {
		return error.response?.data?.message || error.message;
	}
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

export const fetchLatestFilmsFromDB = async (): Promise<CategoryMovies> => {
	try {
		const results = await Promise.allSettled([
			api.get("/films/latest"),
			api.get("/genres"),
			api.get("/home-content"),
		]);

		const filmsResult = results[0];
		const genresResult = results[1];
		const homeContentResult = results[2];

		if (filmsResult.status === "rejected") {
			throw filmsResult.reason;
		}

		const filmsData = filmsResult.value.data;
		const genresData =
			genresResult.status === "fulfilled" ? genresResult.value.data : [];
		const homeContentData =
			homeContentResult.status === "fulfilled" ?
				homeContentResult.value.data
			:	{featuredFilmSlugs: [], categoryCards: []};

		return {
			...filmsData,
			allGenres: genresData,
			homeContent: homeContentData,
		};
	} catch (error: unknown) {
		console.error(
			"Error fetching latest films from DB:",
			getErrorMessage(error),
		);
		throw error;
	}
};

export interface EpisodeItem {
	name: string;
	slug: string;
	embed: string;
	m3u8: string;
}

export interface EpisodeServer {
	server_name: string;
	items: EpisodeItem[];
}

export interface CategoryGroup {
	group: {id: string; name: string};
	list: {id: string; name: string}[];
}

export interface FilmDetail {
	id: string;
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
	time: string;
	quality: string;
	language: string;
	director: string;
	casts: string;
	category: Record<string, CategoryGroup>;
	episodes: EpisodeServer[];
	rating?: number;
	views?: number;
	is_featured?: boolean;
}

export const fetchFilmDetail = async (slug: string): Promise<FilmDetail> => {
	try {
		// Check if we're on the server side
		if (typeof window === "undefined") {
			// Server-side: use fetch with absolute URL
			const baseUrl =
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
			const response = await fetch(`${baseUrl}/api/films/${slug}`, {
				headers: {
					"Content-Type": "application/json",
				},
			});
			if (!response.ok) {
				const errorData = await response.text();
				console.error(`API Error [${response.status}]:`, errorData);
				throw new Error(`Failed to fetch film: ${response.statusText}`);
			}
			const data = await response.json();
			if (data?.status === "success" && data?.movie) {
				return data.movie;
			}
			throw new Error("Film not found");
		} else {
			// Client-side: use axios with base URL
			const response = await api.get(`/films/${slug}`);
			if (response.data?.status === "success" && response.data?.movie) {
				return response.data.movie;
			}
			throw new Error("Film not found");
		}
	} catch (error: unknown) {
		console.error("Error fetching film detail:", getErrorMessage(error));
		throw error;
	}
};

export const incrementView = async (slug: string): Promise<void> => {
	try {
		await api.post("/films/view", {slug});
	} catch (error: unknown) {
		console.error("Error incrementing view:", getErrorMessage(error));
	}
};
