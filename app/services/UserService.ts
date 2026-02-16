import api from "@/app/utils/axios";

/**
 * User-related API interactions
 * Handles: saved films, watch history, profiles, ratings
 */

// ─── Interfaces ───

export interface SavedFilm {
	slug: string;
	name: string;
	thumb_url: string;
	poster_url: string;
	description: string;
}

export interface HistoryEntry {
	filmSlug: string;
	episodeSlug: string;
	episodeName: string;
	serverIdx: number;
	watchedAt: string;
	film?: {
		name: string;
		slug: string;
		original_name?: string;
		thumb_url?: string;
		poster_url?: string;
		total_episodes?: number;
		time?: string;
		quality?: string;
		language?: string;
		rating?: number;
		views?: number;
		genres?: {id: string; name: string}[];
		years?: {id: string; name: string}[];
	};
}

export interface UserProfile {
	_id: string;
	email: string;
	username: string;
	avatar?: string;
	createdAt: string;
	updatedAt: string;
}

export interface UserFilmData {
	success: boolean;
	userRating?: number;
	filmRating?: number;
}

// ─── Saved Films ───

/**
 * Check if a film is saved by current user
 */
export const checkIfFilmSaved = async (slug: string): Promise<boolean> => {
	try {
		const response = await api.get(`/user/saved?slug=${slug}`);
		return !!response.data?.isSaved;
	} catch {
		return false;
	}
};

/**
 * Get all saved films for current user
 */
export const getUserSavedFilms = async (): Promise<SavedFilm[]> => {
	try {
		const response = await api.get("/user/saved");
		return response.data?.films || [];
	} catch (error) {
		console.error("Failed to fetch saved films:", error);
		return [];
	}
};

/**
 * Toggle save status for a film (add or remove)
 */
export const toggleSaveFilm = async (
	slug: string,
	action: "add" | "remove",
): Promise<boolean> => {
	try {
		const response = await api.post("/user/saved", {slug, action});
		return !!response.data?.isSaved;
	} catch (error) {
		console.error("Failed to toggle save film:", error);
		throw error;
	}
};

// ─── Watch History ───

/**
 * Get watch history for a specific film
 */
export const getFilmWatchHistory = async (
	slug: string,
): Promise<{
	episodeSlug: string;
	episodeName: string;
	serverIdx: number;
} | null> => {
	try {
		const response = await api.get(`/user/history?slug=${slug}`);
		if (response.data?.found && response.data?.lastWatched) {
			return {
				episodeSlug: response.data.lastWatched.episodeSlug,
				episodeName: response.data.lastWatched.episodeName,
				serverIdx: response.data.lastWatched.serverIdx,
			};
		}
		return null;
	} catch {
		return null;
	}
};

/**
 * Get all watch history for current user
 */
export const getUserWatchHistory = async (): Promise<HistoryEntry[]> => {
	try {
		const response = await api.get("/user/history");
		return response.data?.history || [];
	} catch (error) {
		console.error("Failed to fetch watch history:", error);
		return [];
	}
};

/**
 * Add or update watch history entry
 */
export const addToWatchHistory = async (filmData: {
	filmSlug: string;
	filmName: string;
	episodeSlug: string;
	episodeName: string;
	serverIdx: number;
	posterUrl: string;
}): Promise<boolean> => {
	try {
		const response = await api.post("/user/history", filmData);
		return response.data?.success || false;
	} catch (error) {
		console.error("Failed to add to watch history:", error);
		return false;
	}
};

// ─── User Ratings ───

/**
 * Get user's rating for a specific film
 */
export const getUserFilmRating = async (
	slug: string,
): Promise<UserFilmData> => {
	try {
		const response = await api.get(`/user/films/${slug}`);
		if (response.data?.success) {
			return {
				success: true,
				userRating: response.data.userRating,
				filmRating: response.data.filmRating,
			};
		}
		return {success: false};
	} catch {
		return {success: false};
	}
};

// ─── User Profile ───

/**
 * Get current user's profile
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
	try {
		const response = await api.get("/user/profile");
		return response.data?.user || null;
	} catch (error) {
		console.error("Failed to fetch user profile:", error);
		return null;
	}
};

/**
 * Get user profile by username
 */
export const getUserProfileByUsername = async (
	username: string,
): Promise<UserProfile | null> => {
	try {
		const response = await api.get("/user/profile", {params: {username}});
		return response.data?.user || null;
	} catch (error) {
		console.error("Failed to fetch user profile:", error);
		return null;
	}
};

/**
 * Update user profile visibility settings
 */
export const updateUserProfileVisibility = async (
	showSavedFilms: boolean,
): Promise<boolean> => {
	try {
		const response = await api.patch("/user/profile", {showSavedFilms});
		return response.data?.success || false;
	} catch (error) {
		console.error("Failed to update profile visibility:", error);
		return false;
	}
};

/**
 * Update user avatar
 */
export const updateUserAvatar = async (avatar: string): Promise<boolean> => {
	try {
		const response = await api.patch("/user/profile", {avatar});
		return response.data?.success || false;
	} catch (error) {
		console.error("Failed to update avatar:", error);
		return false;
	}
};
