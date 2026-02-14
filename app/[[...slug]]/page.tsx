import { notFound } from "next/navigation";
import type { Metadata } from "next";

import HeaderAndFooterLayout from "@/app/components/layouts/HeaderAndFooterLayout";
import NothingLayout from "@/app/components/layouts/NothingLayout";
import HeaderLayout from "../components/layouts/HeaderLayout";

import { PrivateRoute, PublicRoute } from "@/app/components/common/RouteGuard";

import HomePage from "@/app/pages/HomePage";
import SignInPage from "@/app/pages/SignInPage";
import SignUpPage from "@/app/pages/SignUpPage";
import ForgetPasswordPage from "@/app/pages/ForgetPasswordPage";
import ProfilePage from "@/app/pages/ProfilePage";
import ChangeUsernamePage from "@/app/pages/ChangeUsernamePage";
import ChangeEmailPage from "@/app/pages/ChangeEmailPage";
import InfoPage from "@/app/pages/InfoPage";
import WatchPage from "@/app/pages/WatchPage";
import SavedPage from "@/app/pages/SavedPage";
import SearchPage from "@/app/pages/SearchPage";
import WatchHistoryPage from "@/app/pages/WatchHistoryPage";
import MoviePage from "@/app/pages/MoviePage";
import SeriesPage from "@/app/pages/SeriesPage";
import CountriesFilterPage from "@/app/pages/CountriesFilterPage";
import GenresFilterPage from "@/app/pages/GenresFilterPage";
import { fetchFilmDetail } from "@/app/services/movieService";

interface RouteConfig {
	path: string;
	component: React.ComponentType<{
		plotId?: string;
		identifier?: string;
		episodeSlug?: string;
		filterValue?: string;
	}>;
	layout: React.ComponentType<{ children: React.ReactNode }>;
	isPrivate?: boolean;
	isDynamic?: boolean;
}

const routes: RouteConfig[] = [
	{
		path: "/",
		component: HomePage,
		layout: HeaderAndFooterLayout,
		isPrivate: false,
		isDynamic: false,
	},
	{
		path: "/sign-in",
		component: SignInPage,
		layout: NothingLayout,
		isPrivate: false,
		isDynamic: false,
	},
	{
		path: "/sign-up",
		component: SignUpPage,
		layout: NothingLayout,
		isPrivate: false,
		isDynamic: false,
	},
	{
		path: "/forget-password",
		component: ForgetPasswordPage,
		layout: NothingLayout,
		isPrivate: false,
		isDynamic: false,
	},
	{
		path: "/profile",
		component: ProfilePage,
		layout: NothingLayout,
		isPrivate: true,
		isDynamic: false,
	},
	{
		path: "/profile/:identifier",
		component: ProfilePage,
		layout: NothingLayout,
		isPrivate: false,
		isDynamic: true,
	},
	{
		path: "/change-username",
		component: ChangeUsernamePage,
		layout: NothingLayout,
		isPrivate: true,
		isDynamic: false,
	},
	{
		path: "/change-email",
		component: ChangeEmailPage,
		layout: NothingLayout,
		isPrivate: true,
		isDynamic: false,
	},
	{
		path: "/saved",
		component: SavedPage,
		layout: HeaderLayout,
		isPrivate: true,
		isDynamic: false,
	},
	{
		path: "/history",
		component: WatchHistoryPage,
		layout: HeaderLayout,
		isPrivate: true,
		isDynamic: false,
	},
	{
		path: "/search",
		component: SearchPage,
		layout: HeaderLayout,
		isPrivate: false,
		isDynamic: false,
	},
	{
		path: "/movie",
		component: MoviePage,
		layout: HeaderAndFooterLayout,
		isPrivate: false,
		isDynamic: false,
	},
	{
		path: "/series",
		component: SeriesPage,
		layout: HeaderAndFooterLayout,
		isPrivate: false,
		isDynamic: false,
	},
	{
		path: "/the-loai/:identifier",
		component: GenresFilterPage,
		layout: HeaderAndFooterLayout,
		isPrivate: false,
		isDynamic: true,
	},
	{
		path: "/quoc-gia/:identifier",
		component: CountriesFilterPage,
		layout: HeaderAndFooterLayout,
		isPrivate: false,
		isDynamic: true,
	},
	{
		path: "/info/:identifier",
		component: InfoPage,
		layout: HeaderLayout,
		isPrivate: false,
		isDynamic: true,
	},
	{
		path: "/xem/:identifier/:episodeSlug",
		component: WatchPage,
		layout: HeaderLayout,
		isPrivate: false,
		isDynamic: true,
	},
];

interface PageProps {
	params: Promise<{
		slug?: string[];
	}>;
}

function matchRoute(
	path: string,
	pattern: string,
): { matched: boolean; params: Record<string, string> } {
	const pathParts = path.split("/").filter(Boolean);
	const patternParts = pattern.split("/").filter(Boolean);

	if (pathParts.length !== patternParts.length) {
		return { matched: false, params: {} };
	}

	const params: Record<string, string> = {};

	for (let i = 0; i < patternParts.length; i++) {
		if (patternParts[i].startsWith(":")) {
			params[patternParts[i].slice(1)] = pathParts[i];
		} else if (patternParts[i] !== pathParts[i]) {
			return { matched: false, params: {} };
		}
	}

	return { matched: true, params };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	try {
		const { slug } = await params;
		const path = slug ? "/" + slug.join("/") : "/";

		// Check if this is an info or watch route
		if (path.startsWith("/info/")) {
			const identifier = path.replace("/info/", "");
			const film = await fetchFilmDetail(identifier);
			return {
				title: `${film.name} - RapPhim`,
				description:
					film.description ||
					"Xem phim online chất lượng cao, phim lẻ, phim bộ, phim chiếu rạp mới nhất hoàn toàn miễn phí.",
				openGraph: {
					title: `${film.name} - RapPhim`,
					description:
						film.description ||
						"Xem phim online chất lượng cao, phim lẻ, phim bộ, phim chiếu rạp mới nhất hoàn toàn miễn phí.",
					images: [
						{
							url: film.poster_url,
							width: 500,
							height: 750,
							alt: film.name,
						},
					],
					type: "website",
				},
				twitter: {
					card: "summary_large_image",
					title: `${film.name} - RapPhim`,
					description:
						film.description?.substring(0, 160) ||
						"Xem phim online chất lượng cao",
					images: [film.poster_url],
				},
			};
		} else if (path.startsWith("/xem/")) {
			const parts = path.split("/").filter(Boolean);
			const identifier = parts[1];
			const film = await fetchFilmDetail(identifier);
			return {
				title: `Xem ${film.name} - RapPhim`,
				description:
					film.description ||
					"Xem phim online chất lượng cao, phim lẻ, phim bộ, phim chiếu rạp mới nhất hoàn toàn miễn phí.",
				openGraph: {
					title: `Xem ${film.name} - RapPhim`,
					description:
						film.description ||
						"Xem phim online chất lượng cao, phim lẻ, phim bộ, phim chiếu rạp mới nhất hoàn toàn miễn phí.",
					images: [
						{
							url: film.poster_url,
							width: 500,
							height: 750,
							alt: film.name,
						},
					],
					type: "website",
				},
				twitter: {
					card: "summary_large_image",
					title: `Xem ${film.name} - RapPhim`,
					description:
						film.description?.substring(0, 160) ||
						"Xem phim online chất lượng cao",
					images: [film.poster_url],
				},
			};
		}

		// Default metadata for non-dynamic routes
		return {
			title: "RapPhim - Xem Phim Online Miễn Phí",
			description:
				"Xem phim online chất lượng cao, phim lẻ, phim bộ, phim chiếu rạp mới nhất hoàn toàn miễn phí.",
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		console.error(
			"[generateMetadata] Error fetching film detail:",
			errorMessage,
			"\nFalling back to default metadata",
		);
		return {
			title: "RapPhim - Xem Phim Online Miễn Phí",
			description:
				"Xem phim online chất lượng cao, phim lẻ, phim bộ, phim chiếu rạp mới nhất hoàn toàn miễn phí.",
		};
	}
}

export default async function DynamicPage({ params }: PageProps) {
	const { slug } = await params;
	const path = slug ? "/" + slug.join("/") : "/";

	let matchedRoute: RouteConfig | undefined;
	let routeParams: Record<string, string> = {};

	for (const route of routes) {
		if (route.isDynamic) {
			const result = matchRoute(path, route.path);
			if (result.matched) {
				matchedRoute = route;
				routeParams = result.params;
				break;
			}
		} else if (route.path === path) {
			matchedRoute = route;
			break;
		}
	}

	if (!matchedRoute) {
		notFound();
	}

	const { component: Component, layout: Layout, isPrivate } = matchedRoute;
	const Guard = isPrivate ? PrivateRoute : PublicRoute;

	// Determine filter value for genre/country filter pages
	let filterValue: string | undefined;
	if (
		matchedRoute.path === "/the-loai/:identifier" ||
		matchedRoute.path === "/quoc-gia/:identifier"
	) {
		filterValue = routeParams.identifier;
	}

	return (
		<Layout>
			<Guard>
				<Component
					plotId={routeParams.id}
					identifier={routeParams.identifier}
					episodeSlug={routeParams.episodeSlug}
					filterValue={filterValue}
				/>
			</Guard>
		</Layout>
	);
}
