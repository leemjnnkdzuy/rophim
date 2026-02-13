

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
    formats?: { id: string; name: string }[];
    genres?: { id: string; name: string }[];
    years?: { id: string; name: string }[];
    countries?: { id: string; name: string }[];
}



// Define the shape of the new API response
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
}

import api from "@/app/utils/axios";

export const fetchLatestFilmsFromDB = async (): Promise<CategoryMovies> => {
    try {
        const [filmsResponse, genresResponse] = await Promise.all([
            api.get('/films/latest'),
            api.get('/genres')
        ]);

        return {
            ...filmsResponse.data,
            allGenres: genresResponse.data
        };
    } catch (error: any) {
        console.error("Error fetching latest films from DB:", error.response?.data || error.message);
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
    group: { id: string; name: string };
    list: { id: string; name: string }[];
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
        const response = await api.get(`/films/${slug}`);
        if (response.data?.status === 'success' && response.data?.movie) {
            return response.data.movie;
        }
        throw new Error("Film not found");
    } catch (error: any) {
        console.error("Error fetching film detail:", error.response?.data || error.message);
        throw error;
    }
};

export const incrementView = async (slug: string): Promise<void> => {
    try {
        await api.post('/films/view', { slug });
    } catch (error: any) {
        console.error("Error incrementing view:", error.message);
    }
};
