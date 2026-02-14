import {useEffect} from "react";

const DEFAULT_TITLE = "RapPhim - Xem Phim Online Miễn Phí";

/**
 * Only updates document.title for client-side navigation.
 * All SEO meta tags (og, twitter, description) are handled
 * server-side by generateMetadata in page.tsx — do NOT touch them here
 * to avoid overwriting correct server-rendered values.
 */
export function usePageMetadata(title?: string | null) {
	useEffect(() => {
		if (title) {
			document.title = title;
		}
		return () => {
			document.title = DEFAULT_TITLE;
		};
	}, [title]);
}
