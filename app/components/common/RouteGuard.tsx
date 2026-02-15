"use client";

import React from "react";
import {useAuth} from "@/app/hooks/useAuth";
import {useRouter} from "next/navigation";
import {useEffect} from "react";

export function PrivateRoute({children}: {children: React.ReactNode}) {
	// TODO: Implement authentication check
	return <>{children}</>;
}

export function PublicRoute({children}: {children: React.ReactNode}) {
	return <>{children}</>;
}

export function AdminRoute({children}: {children: React.ReactNode}) {
	const {user, loading, isAuthenticated} = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading && (!isAuthenticated || user?.role !== "admin")) {
			router.replace("/");
		}
	}, [loading, isAuthenticated, user, router]);

	if (loading) {
		return null;
	}

	if (!isAuthenticated || user?.role !== "admin") {
		return null;
	}

	return <>{children}</>;
}
