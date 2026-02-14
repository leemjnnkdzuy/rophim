import {useMemo} from "react";

interface MovieMetadata {
	title?: string;
	description?: string;
	poster_url?: string;
	year?: number;
	genres?: Array<{name: string}>;
	rating?: number;
}

interface MetadataResult {
	title: string;
	description: string;
}

const DEFAULT_TITLE = "RoPhim - Xem Phim Online Miễn Phí";
const DEFAULT_DESCRIPTION =
	"Xem phim online chất lượng cao, phim lẻ, phim bộ, phim chiếu rạp mới nhất hoàn toàn miễn phí.";

export function useMetadata(movie?: MovieMetadata | null): MetadataResult {
	return useMemo(() => {
		if (!movie || !movie.title) {
			return {
				title: DEFAULT_TITLE,
				description: DEFAULT_DESCRIPTION,
			};
		}

		// Tạo title tùy chỉnh
		const customTitle = `${movie.title}${movie.year ? ` (${movie.year})` : ""} - RoPhim`;

		// Tạo description tùy chỉnh
		let customDescription = `Xem ${movie.title}`;

		if (movie.genres && movie.genres.length > 0) {
			const genreNames = movie.genres
				.map((g) => g.name)
				.slice(0, 3)
				.join(", ");
			customDescription += ` - Thể loại: ${genreNames}`;
		}

		if (movie.rating && movie.rating > 0) {
			customDescription += ` - Đánh giá: ${movie.rating}/10`;
		}

		customDescription += " - Xem online miễn phí tại RoPhim";

		return {
			title: customTitle,
			description: customDescription,
		};
	}, [movie]);
}
