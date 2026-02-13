"use client";

import {createContext, useContext, useEffect, useState} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
	theme: "dark",
	toggleTheme: () => {},
	setTheme: () => {},
});

export function ThemeProvider({children}: {children: React.ReactNode}) {
	const [theme, setThemeState] = useState<Theme>("dark");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		const savedTheme = localStorage.getItem("theme") as Theme | null;
		if (savedTheme) {
			setThemeState(savedTheme);
		} else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
			setThemeState("light");
		}
	}, []);

	useEffect(() => {
		if (mounted) {
			localStorage.setItem("theme", theme);
			document.documentElement.setAttribute("data-theme", theme);
			if (theme === "dark") {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
		}
	}, [theme, mounted]);

	const toggleTheme = () => {
		setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
	};

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
	};

	return (
		<ThemeContext.Provider value={{theme, toggleTheme, setTheme}}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
