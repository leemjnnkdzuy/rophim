"use client";

import {useAuthContext} from "@/app/contexts/AuthContext";

interface UserInfo {
	id: string;
	username: string;
	email: string;
	avatar?: string;
	role?: "user" | "admin";
}

export function useAuth({enabled = true}: {enabled?: boolean} = {}): {
	user: UserInfo | null;
	loading: boolean;
	isAuthenticated: boolean;
	login: (
		identifier: string,
		password: string,
		rememberMe?: boolean,
	) => Promise<{success: boolean; message?: string}>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
} {
	const context = useAuthContext();

	if (!enabled) {
		return {
			user: null,
			loading: false,
			isAuthenticated: false,
			login: context.login,
			logout: context.logout,
			refreshUser: context.refreshUser,
		};
	}

	return {
		user: context.user,
		loading: context.loading,
		isAuthenticated: context.isAuthenticated,
		login: context.login,
		logout: context.logout,
		refreshUser: context.refreshUser,
	};
}
