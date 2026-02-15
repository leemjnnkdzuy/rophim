
import { Movie } from "@/app/types/movie";

export interface AppTitle {
    id: string;
    name: string;
}

// Unified interface representing the raw movie data from API/DB
export interface ApiMovieItem {
    id?: string;
    slug: string;
    name: string;
    original_name: string;
    thumb_url: string; // Often used as BACKDROP
    poster_url: string; // Often used as POSTER
    created?: string;
    modified?: string;
    description?: string;
    total_episodes?: number;
    current_episode?: string;
    time?: string | null;
    quality?: string;
    language?: string;
    views?: number;
    rating?: number;
    year?: number;
    years?: AppTitle[];
    genres?: AppTitle[];
    formats?: AppTitle[];
    countries?: AppTitle[];
    // Helper fields sometimes present or needed
    isNew?: boolean;
}

/**
 * Formats the episode string based on current and total episodes.
 */
export function formatEpisode(film: ApiMovieItem): string {
    // If it's a single movie (Phim lẻ) or has only 1 episode, usually return empty string
    // logic taken from existing pages
    if (
        film.formats?.some((f) => f.name === "Phim lẻ") ||
        film.total_episodes === 1
    ) {
        return "";
    }

    const current = film.current_episode;
    const total = film.total_episodes;

    if (!current) return total ? `${total} Tập` : "";

    const currentLower = current.toLowerCase();

    // Check for "full" or "complete" status hints
    if (
        currentLower.includes("full") ||
        currentLower.includes("hoàn tất")
    ) {
        return total ? `Hoàn Thành ${total} Tập` : "Hoàn Thành";
    }

    const num = parseInt(current.replace(/\D/g, ""));
    // If current episode number >= total episodes -> Completed
    if (!isNaN(num) && total && total > 0) {
        return num >= total
            ? `Hoàn Thành ${total} Tập`
            : `Tập ${num}/${total}`;
    }

    return current;
}

/**
 * Maps the raw API movie item to the standard Movie interface used by UI components.
 */
export function mapFilmToMovie(film: ApiMovieItem, index?: number): Movie {
    // Determine year
    const yearValue =
        film.years && film.years.length > 0 && film.years[0].name
            ? parseInt(film.years[0].name)
            : film.created
                ? new Date(film.created).getFullYear()
                : new Date().getFullYear();

    return {
        id: film.slug || film.id || (index !== undefined ? index + 1000 : "unknown"),
        title: film.name,
        originalTitle: film.original_name,
        year: isNaN(yearValue) ? new Date().getFullYear() : yearValue,
        rating: film.rating || 0,
        quality: film.quality || "HD",
        poster: film.poster_url, // Default poster is the portrait one
        backdrop: film.thumb_url, // Default backdrop is the landscape one
        genre: film.genres?.map((g) => g.name) || [],
        duration: film.time || "N/A",
        views: film.views ? film.views.toLocaleString() : "0",
        language: film.language || "",
        description: film.description || "",
        episode: formatEpisode(film),
        isNew: film.isNew,
        country: film.countries && film.countries.length > 0 ? film.countries[0].name : undefined,
    };
}
