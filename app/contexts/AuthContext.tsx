"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	ReactNode,
} from "react";
import api from "@/app/utils/axios";

interface User {
	id: string;
	username: string;
	email: string;
	avatar?: string;
	role?: "user" | "admin";
	isVerified?: boolean;
	createdAt?: string;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	isAuthenticated: boolean;
	login: (
		identifier: string,
		password: string,
		rememberMe?: boolean,
	) => Promise<{success: boolean; message?: string}>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchUser = useCallback(async () => {
		const hasAuth = localStorage.getItem("rapphim_auth_status");
		if (!hasAuth) {
			setLoading(false);
			return;
		}

		try {
			const res = await api.get("/auth/me");
			setUser(res.data.user);
		} catch {
			setUser(null);
			localStorage.removeItem("rapphim_auth_status");
		} finally {
			setLoading(false);
		}
	}, []);

	const login = useCallback(
		async (identifier: string, password: string, rememberMe = false) => {
			try {
				const res = await api.post("/auth/login", {
					identifier,
					password,
					rememberMe,
				});
				setUser(res.data.user);
				localStorage.setItem("rapphim_auth_status", "true");
				return {success: true};
			} catch (error: unknown) {
				const axiosError = error as {
					response?: {data?: {message?: string}};
				};
				return {
					success: false,
					message:
						axiosError.response?.data?.message ||
						"Đăng nhập thất bại",
				};
			}
		},
		[],
	);

	const logout = useCallback(async () => {
		try {
			await api.post("/auth/logout");
		} finally {
			setUser(null);
			localStorage.removeItem("rapphim_auth_status");
		}
	}, []);

	const refreshUser = useCallback(async () => {
		await fetchUser();
	}, [fetchUser]);

	useEffect(() => {
		fetchUser();
	}, [fetchUser]);

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				isAuthenticated: !!user,
				login,
				logout,
				refreshUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuthContext() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}
	return context;
}
