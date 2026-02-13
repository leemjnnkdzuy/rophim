"use client";

import {AuthProvider} from "@/app/contexts/AuthContext";
import {ThemeProvider} from "@/app/contexts/ThemeContext";
import {GlobalNotificationProvider} from "@/app/contexts/GlobalNotificationContext";

export function ClientProviders({children}: {children: React.ReactNode}) {
	return (
		<ThemeProvider>
			<AuthProvider>
				<GlobalNotificationProvider>
					{children}
				</GlobalNotificationProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}
