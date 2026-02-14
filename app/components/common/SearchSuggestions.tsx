"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Film, Loader2, ArrowRight, Clock } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import api from "@/app/utils/axios";

interface SuggestionFilm {
    slug: string;
    name: string;
    original_name?: string;
    poster_url?: string;
    thumb_url?: string;
    quality?: string;
    language?: string;
    years?: { id: string; name: string }[];
    genres?: { id: string; name: string }[];
    total_episodes?: number;
    formats?: { id: string; name: string }[];
}

export function SearchWithSuggestions() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<SuggestionFilm[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search
    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.get("/films/search", {
                params: { q: q.trim(), limit: 8 },
            });
            const films: SuggestionFilm[] = res.data?.films || [];
            setSuggestions(films);
            setIsOpen(films.length > 0);
        } catch {
            setSuggestions([]);
            setIsOpen(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setSelectedIndex(-1);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchSuggestions(value);
        }, 300);
    };

    // Navigate to full search
    const handleSearch = () => {
        if (query.trim()) {
            setIsOpen(false);
            inputRef.current?.blur();
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    // Navigate to a film
    const handleSelectFilm = (slug: string) => {
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
        router.push(`/info/${slug}`);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                handleSelectFilm(suggestions[selectedIndex].slug);
            } else {
                handleSearch();
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((i) =>
                i < suggestions.length - 1 ? i + 1 : i
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((i) => (i > 0 ? i - 1 : -1));
        } else if (e.key === "Escape") {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const getYear = (film: SuggestionFilm) => {
        if (film.years && film.years.length > 0) return film.years[0].name;
        return null;
    };

    const isSeries = (film: SuggestionFilm) =>
        film.formats?.some((f) => f.name === "Phim bộ");

    return (
        <div
            ref={containerRef}
            className={`hidden md:flex relative max-w-md w-64 transition-all duration-300 ${isFocused ? "w-80" : ""}`}
        >
            <div
                className={`relative w-full group ${isFocused ? "ring-1 ring-[#8ae4ff]/50" : ""} rounded-full`}
            >
                {isLoading ? (
                    <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8ae4ff] animate-spin" />
                ) : (
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-hover:text-gray-400 transition-colors" />
                )}
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Tìm kiếm phim..."
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        setIsFocused(true);
                        if (suggestions.length > 0 && query.trim().length >= 2) {
                            setIsOpen(true);
                        }
                    }}
                    onBlur={() => setIsFocused(false)}
                    autoComplete="off"
                    className="w-full pl-10 pr-20 h-9 bg-white/5 border-white/10 rounded-full text-sm text-white placeholder:text-gray-500 focus-visible:ring-[#8ae4ff]/30 hover:bg-white/8 transition-colors"
                />
                <Button
                    onClick={handleSearch}
                    disabled={!query.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-4 bg-[#8ae4ff] hover:bg-[#8ae4ff]/90 text-black rounded-full font-semibold text-xs shadow-lg shadow-[#8ae4ff]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Tìm
                </Button>
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#161625] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Results */}
                    <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                        {suggestions.map((film, index) => (
                            <button
                                key={film.slug}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectFilm(film.slug);
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${selectedIndex === index
                                        ? "bg-white/10"
                                        : "hover:bg-white/5"
                                    }`}
                            >
                                {/* Thumbnail */}
                                <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-white/5">
                                    {film.thumb_url || film.poster_url ? (
                                        <Image
                                            src={film.thumb_url || film.poster_url || ""}
                                            alt={film.name}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Film className="h-4 w-4 text-gray-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {film.name}
                                    </p>
                                    {film.original_name && film.original_name !== film.name && (
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {film.original_name}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                        {film.quality && (
                                            <Badge className="bg-[#8ae4ff]/15 text-[#8ae4ff] border-0 text-[10px] px-1.5 py-0 font-medium">
                                                {film.quality}
                                            </Badge>
                                        )}
                                        {getYear(film) && (
                                            <span className="text-[10px] text-gray-500">
                                                {getYear(film)}
                                            </span>
                                        )}
                                        {isSeries(film) && (
                                            <span className="text-[10px] text-orange-400/80">
                                                {film.total_episodes
                                                    ? `${film.total_episodes} tập`
                                                    : "Phim bộ"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Arrow */}
                                <ArrowRight
                                    className={`h-3.5 w-3.5 shrink-0 transition-opacity ${selectedIndex === index
                                            ? "text-[#8ae4ff] opacity-100"
                                            : "text-gray-600 opacity-0"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Footer - See all results */}
                    {query.trim() && (
                        <div className="border-t border-white/5">
                            <button
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSearch();
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-[#8ae4ff] hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <Search className="h-3.5 w-3.5" />
                                Xem tất cả kết quả cho &quot;{query.trim()}&quot;
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
