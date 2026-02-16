/**
 * Services Index
 * Central export point for all application services
 */

// Home Content Management
export {
	buildHomeContentPayload,
	serializeHomeContentPayload,
	fetchHomeContent,
	saveHomeContent,
	searchAdminFilms,
	searchFilmsBySlugs,
	imageToBase64,
	type FilmItem,
	type CategoryCard,
	type HomeContentPayload,
} from "./HomeContentService";

// Movie / Film Data
export {
	fetchLatestFilmsFromDB,
	fetchFilmDetail,
	incrementView,
	fetchMoviesPageData,
	fetchSeriesPageData,
	type MovieItem,
	type FilmDetail,
	type EpisodeItem,
	type EpisodeServer,
	type CategoryMovies,
} from "./movieService";

// Authentication
export {authService} from "./AuthService";

// User Data
export {
	checkIfFilmSaved,
	getUserSavedFilms,
	toggleSaveFilm,
	getFilmWatchHistory,
	getUserWatchHistory,
	addToWatchHistory,
	getUserFilmRating,
	getUserProfile,
	getUserProfileByUsername,
	updateUserProfileVisibility,
	updateUserAvatar,
	type SavedFilm,
	type HistoryEntry,
	type UserProfile,
	type UserFilmData,
} from "./UserService";

// Filter & Search
export {
	fetchFilterOptions,
	fetchGenres,
	fetchCountries,
	fetchYears,
	filterFilms,
	searchFilms,
	searchFilmsByGenre,
	type MovieItem as FilterMovieItem,
	type GenreItem,
	type CountryItem,
	type YearItem,
	type FormatItem,
} from "./FilterService";
