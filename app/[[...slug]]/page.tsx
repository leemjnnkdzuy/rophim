import {notFound} from "next/navigation";

import FooterLayout from "@/app/components/layouts/FooterLayout";
import NothingLayout from "@/app/components/layouts/NothingLayout";
import HeaderLayout from "../components/layouts/HeaderLayout";

import {PrivateRoute, PublicRoute} from "@/app/components/common/RouteGuard";

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

interface RouteConfig {
	path: string;
	component: React.ComponentType<{
		plotId?: string;
		identifier?: string;
		episodeSlug?: string;
	}>;
	layout: React.ComponentType<{children: React.ReactNode}>;
	isPrivate?: boolean;
	isDynamic?: boolean;
}

const routes: RouteConfig[] = [
	{
		path: "/",
		component: HomePage,
		layout: HeaderLayout,
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
): {matched: boolean; params: Record<string, string>} {
	const pathParts = path.split("/").filter(Boolean);
	const patternParts = pattern.split("/").filter(Boolean);

	if (pathParts.length !== patternParts.length) {
		return {matched: false, params: {}};
	}

	const params: Record<string, string> = {};

	for (let i = 0; i < patternParts.length; i++) {
		if (patternParts[i].startsWith(":")) {
			params[patternParts[i].slice(1)] = pathParts[i];
		} else if (patternParts[i] !== pathParts[i]) {
			return {matched: false, params: {}};
		}
	}

	return {matched: true, params};
}

export default async function DynamicPage({params}: PageProps) {
	const {slug} = await params;
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

	const {component: Component, layout: Layout, isPrivate} = matchedRoute;
	const Guard = isPrivate ? PrivateRoute : PublicRoute;

	return (
		<Layout>
			<Guard>
				<Component
					plotId={routeParams.id}
					identifier={routeParams.identifier}
					episodeSlug={routeParams.episodeSlug}
				/>
			</Guard>
		</Layout>
	);
}
