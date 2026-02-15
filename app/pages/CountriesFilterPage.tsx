"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MovieCard } from "@/app/components/common/MovieCard";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
    Filter,
    X,
    Loader2,
    Film,
    TrendingUp,
    Sparkles,
    Clock,
    Tag,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MapPin,
    Calendar,
    Layers,
} from "lucide-react";
import api from "@/app/utils/axios";
import { Movie } from "@/app/types/movie";
import { LoadingScreen } from "@/app/components/common/LoadingScreen";

// ─── Sort Options ───
const SORT_OPTIONS = [
    { value: "views", label: "Lượt xem", icon: TrendingUp },
    { value: "rating", label: "Đánh giá", icon: Sparkles },
    { value: "latest", label: "Mới nhất", icon: Clock },
];

// ─── Types ───
interface FilmRaw {
    slug: string;
    name: string;
    original_name: string;
    thumb_url: string;
    poster_url: string;
    created: string;
    modified: string;
    description: string;
    total_episodes: number;
    current_episode?: string;
    time: string | null;
    quality: string;
    language: string;
    director: string | null;
    casts: string | null;
    formats?: { id: string; name: string }[];
    genres?: { id: string; name: string }[];
    years?: { id: string; name: string }[];
    countries?: { id: string; name: string }[];
    rating?: number;
    views?: number;
}

interface PaginationInfo {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

// ─── Helpers ───
function formatEpisode(film: FilmRaw): string {
    if (
        film.formats?.some((f) => f.name === "Phim lẻ") ||
        film.total_episodes === 1
    ) {
        return "";
    }

    const current = film.current_episode;
    const total = film.total_episodes || 0;

    if (!current) return total ? `${total} Tập` : "";

    const currentLower = current.toLowerCase();
    if (currentLower.includes("full") || currentLower.includes("hoàn tất")) {
        return total ? `Hoàn Thành ${total} Tập` : "Hoàn Thành";
    }

    const num = parseInt(current.replace(/\D/g, ""));
    if (!isNaN(num) && total && total > 0) {
        return num >= total
            ? `Hoàn Thành ${total} Tập`
            : `Tập ${num}/${total}`;
    }
    return current;
}

function mapFilmToMovie(film: FilmRaw): Movie {
    const year =
        film.years && film.years.length > 0 && film.years[0].name
            ? parseInt(film.years[0].name)
            : film.created
                ? new Date(film.created).getFullYear()
                : new Date().getFullYear();

    return {
        id: film.slug,
        title: film.name,
        originalTitle: film.original_name,
        year,
        rating: film.rating || 0,
        quality: film.quality || "HD",
        episode: formatEpisode(film),
        backdrop: film.poster_url,
        poster: film.thumb_url,
        genre: film.genres?.map((g) => g.name) || [],
        country: film.countries?.[0]?.name || "",
        duration: film.time || "N/A",
        views: film.views ? film.views.toLocaleString() : "0",
        language: film.language,
        description: film.description,
    };
}

// ─── Pagination Controls ───
function PaginationControls({
    pagination,
    currentPage,
    onPageChange,
    isLoading,
}: {
    pagination: PaginationInfo;
    currentPage: number;
    onPageChange: (page: number) => void;
    isLoading: boolean;
}) {
    const { totalPages, totalCount } = pagination;

    const getPageNumbers = (): (number | "...")[] => {
        const pages: (number | "...")[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        pages.push(1);
        if (currentPage > 3) pages.push("...");

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);

        if (currentPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);

        return pages;
    };

    return (
        <div className='flex flex-col items-center gap-4 mt-10'>
            <p className='text-sm text-gray-400'>
                Trang{" "}
                <span className='text-primary font-semibold'>{currentPage}</span>{" "}
                / {totalPages} • Tổng{" "}
                <span className='text-white font-semibold'>
                    {totalCount.toLocaleString()}
                </span>{" "}
                phim
            </p>

            <div className='flex items-center gap-1.5 flex-wrap justify-center'>
                <Button
                    variant='outline'
                    size='icon'
                    disabled={currentPage === 1 || isLoading}
                    onClick={() => onPageChange(1)}
                    className='h-9 w-9 border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer'
                >
                    <ChevronsLeft className='h-4 w-4' />
                </Button>
                <Button
                    variant='outline'
                    size='icon'
                    disabled={currentPage === 1 || isLoading}
                    onClick={() => onPageChange(currentPage - 1)}
                    className='h-9 w-9 border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer'
                >
                    <ChevronLeft className='h-4 w-4' />
                </Button>

                {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                        <span
                            key={`ellipsis-${idx}`}
                            className='px-2 text-gray-500 text-sm select-none'
                        >
                            ...
                        </span>
                    ) : (
                        <Button
                            key={page}
                            variant='outline'
                            size='icon'
                            onClick={() => onPageChange(page)}
                            disabled={isLoading}
                            className={`h-9 w-9 border-white/10 transition-all cursor-pointer ${currentPage === page
                                ? "bg-primary text-black border-primary font-bold shadow-lg shadow-primary/20"
                                : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                                }`}
                        >
                            {page}
                        </Button>
                    ),
                )}

                <Button
                    variant='outline'
                    size='icon'
                    disabled={currentPage === totalPages || isLoading}
                    onClick={() => onPageChange(currentPage + 1)}
                    className='h-9 w-9 border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer'
                >
                    <ChevronRight className='h-4 w-4' />
                </Button>
                <Button
                    variant='outline'
                    size='icon'
                    disabled={currentPage === totalPages || isLoading}
                    onClick={() => onPageChange(totalPages)}
                    className='h-9 w-9 border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer'
                >
                    <ChevronsRight className='h-4 w-4' />
                </Button>
            </div>
        </div>
    );
}

// ─── Main Page Component ───
interface CountriesFilterPageProps {
    filterValue?: string;
}

export default function CountriesFilterPage({
    filterValue,
}: CountriesFilterPageProps) {
    // Decode the value (in case it comes from URL slug)
    const decodedValue = decodeURIComponent(filterValue || "").replace(/-/g, " ");

    // Capitalize first letter of each word
    const displayValue = decodedValue
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    // State
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 24,
        totalCount: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
    });

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [selectedSort, setSelectedSort] = useState("views");

    // 4 Filters: Formats, Genres, Countries, Years
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [selectedYears, setSelectedYears] = useState<string[]>([]);

    // Available filter options
    const [formatOptions, setFormatOptions] = useState<string[]>([]);
    const [genreOptions, setGenreOptions] = useState<string[]>([]);
    const [countryOptions, setCountryOptions] = useState<string[]>([]);
    const [yearOptions, setYearOptions] = useState<string[]>([]);

    // Fetch available filter options on mount
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [formatsRes, genresRes, countriesRes, yearsRes] = await Promise.all([
                    api.get("/formats"),
                    api.get("/genres"),
                    api.get("/countries"),
                    api.get("/years"),
                ]);

                if (Array.isArray(formatsRes.data)) {
                    setFormatOptions(formatsRes.data.filter(Boolean));
                }
                if (Array.isArray(genresRes.data)) {
                    setGenreOptions(genresRes.data.filter(Boolean));
                }
                if (Array.isArray(countriesRes.data)) {
                    setCountryOptions(countriesRes.data.filter(Boolean));
                }
                if (Array.isArray(yearsRes.data)) {
                    setYearOptions(yearsRes.data);
                }
            } catch {
                console.error("Failed to fetch filter options");
            }
        };
        fetchOptions();
    }, []);

    // Fetch films
    const fetchFilms = useCallback(
        async (page: number, isPaging = false) => {
            try {
                if (isPaging) {
                    setIsPaginating(true);
                } else {
                    setIsLoading(true);
                }

                const params: Record<string, string | number> = {
                    page,
                    limit: 24,
                    sort: selectedSort,
                    // Main context is country, allow filtering by multiple other countries too if needed
                    country: [displayValue, ...selectedCountries].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(","),
                };

                if (selectedGenres.length > 0) {
                    params.genre = selectedGenres.join(",");
                }
                if (selectedYears.length > 0) {
                    params.year = selectedYears.join(",");
                }
                if (selectedFormats.length > 0) {
                    params.format = selectedFormats.join(",");
                }

                const response = await api.get("/films/filter", { params });
                const data = response.data;

                const mappedMovies: Movie[] = (data.films || []).map(
                    (film: FilmRaw) => mapFilmToMovie(film),
                );

                setMovies(mappedMovies);
                setPagination(
                    data.pagination || {
                        page,
                        limit: 24,
                        totalCount: mappedMovies.length,
                        totalPages: 1,
                        hasNext: false,
                        hasPrev: false,
                    },
                );
                setCurrentPage(page);

                // Update URL without reload
                const url = new URL(window.location.href);
                if (page === 1) {
                    url.searchParams.delete("page");
                } else {
                    url.searchParams.set("page", page.toString());
                }
                window.history.replaceState({}, "", url.toString());

                if (isPaging) {
                    const section = document.getElementById(
                        "country-results-section",
                    );
                    if (section) {
                        section.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching filtered films:", error);
                setMovies([]);
            } finally {
                setIsLoading(false);
                setIsPaginating(false);
            }
        },
        [displayValue, selectedSort, selectedFormats, selectedGenres, selectedCountries, selectedYears],
    );

    // Fetch on mount and when filters change
    useEffect(() => {
        fetchFilms(1);
    }, [fetchFilms]);

    const handlePageChange = (page: number) => {
        if (page < 1 || page > pagination.totalPages || isPaginating) return;
        fetchFilms(page, true);
    };

    // Toggle logic for filters
    const toggleFilter = (
        value: string,
        current: string[],
        updater: (v: string[]) => void
    ) => {
        if (current.includes(value)) {
            updater(current.filter((item) => item !== value));
        } else {
            updater([...current, value]);
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setSelectedFormats([]);
        setSelectedGenres([]);
        setSelectedCountries([]);
        setSelectedYears([]);
    };

    const activeFilterCount =
        selectedFormats.length +
        selectedGenres.length +
        selectedCountries.length +
        selectedYears.length;

    return (
        <>
            {/* Page Header */}
            <section className='relative overflow-hidden'>
                <div className='absolute inset-0 bg-neutral-950' />
                <div className='absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(138,228,255,0.12),transparent)]' />

                {/* Decorative elements */}
                <div className='absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[150px] rounded-full pointer-events-none' />
                <div className='absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none' />

                <div className='relative w-full px-4 lg:px-32 pt-10 pb-6'>
                    <div className='flex items-center gap-4 mb-2'>
                        <div>
                            <h1 className='text-3xl lg:text-4xl font-black text-white'>
                                Phim {displayValue}
                            </h1>
                            <p className='text-gray-400 text-sm mt-1'>
                                Khám phá kho phim từ {displayValue}
                            </p>
                        </div>
                    </div>

                    <div className='flex items-center gap-3 mt-4 flex-wrap'>
                        <Badge className='bg-primary/10 text-primary border-primary/20 px-3 py-1.5'>
                            <Sparkles className='h-3.5 w-3.5 mr-1.5' />
                            {pagination.totalCount.toLocaleString()} phim
                        </Badge>
                        <Badge className='bg-white/5 text-gray-300 border-white/10 px-3 py-1.5'>
                            <MapPin className='h-3.5 w-3.5 mr-1.5' />
                            {displayValue}
                        </Badge>
                    </div>
                </div>
            </section>

            {/* Filter & Sort Bar */}
            <section
                id='country-results-section'
                className='w-full px-4 lg:px-32 py-6 scroll-mt-20'
            >
                <div className='mb-6'>
                    <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4'>
                        <div className='flex items-center gap-3 flex-wrap'>
                            <Button
                                onClick={() => setShowFilters(!showFilters)}
                                variant='outline'
                                className='border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-lg'
                            >
                                <Filter className='h-4 w-4 mr-2' />
                                Bộ lọc
                                {activeFilterCount > 0 && (
                                    <Badge className='ml-2 bg-[#8ae4ff] text-black text-xs px-1.5 py-0 border-0'>
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>

                            {/* Sort Options */}
                            <div className='flex items-center gap-2'>
                                {SORT_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <Button
                                            key={option.value}
                                            onClick={() =>
                                                setSelectedSort(option.value)
                                            }
                                            variant='outline'
                                            className={`border-white/10 rounded-lg transition-all ${selectedSort === option.value
                                                ? "bg-[#8ae4ff]/20 border-[#8ae4ff]/50 text-[#8ae4ff]"
                                                : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                                                }`}
                                        >
                                            <Icon className='h-4 w-4 mr-2' />
                                            {option.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        <p className='text-gray-400 text-sm'>
                            Tìm thấy{" "}
                            <span className='text-[#8ae4ff] font-semibold'>
                                {movies.length}
                            </span>{" "}
                            kết quả
                        </p>
                    </div>

                    {/* Expanded Filter Panel */}
                    {showFilters && (
                        <div className='p-4 bg-white/5 border border-white/10 rounded-xl mb-4 animate-in slide-in-from-top-2'>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                                {/* Format Filter */}
                                <div>
                                    <p className='text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2'>
                                        <Layers className="h-3.5 w-3.5" />
                                        Định dạng
                                    </p>
                                    <div className='flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar'>
                                        {formatOptions.map((fmt) => (
                                            <Badge
                                                key={`fmt-${fmt}`}
                                                onClick={() => toggleFilter(fmt, selectedFormats, setSelectedFormats)}
                                                className={`cursor-pointer transition-all select-none ${selectedFormats.includes(fmt)
                                                    ? "bg-[#8ae4ff] text-black border-[#8ae4ff]"
                                                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                                                    }`}
                                            >
                                                {fmt}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Genre Filter */}
                                <div>
                                    <p className='text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2'>
                                        <Tag className="h-3.5 w-3.5" />
                                        Thể loại
                                    </p>
                                    <div className='flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar'>
                                        {genreOptions.map((genre) => (
                                            <Badge
                                                key={`genre-${genre}`}
                                                onClick={() => toggleFilter(genre, selectedGenres, setSelectedGenres)}
                                                className={`cursor-pointer transition-all select-none ${selectedGenres.includes(genre)
                                                    ? "bg-[#8ae4ff] text-black border-[#8ae4ff]"
                                                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                                                    }`}
                                            >
                                                {genre}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Country Filter */}
                                <div>
                                    <p className='text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2'>
                                        <MapPin className="h-3.5 w-3.5" />
                                        Quốc gia
                                    </p>
                                    <div className='flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar'>
                                        {countryOptions?.filter(c => c !== displayValue).map((country) => (
                                            <Badge
                                                key={`country-${country}`}
                                                onClick={() => toggleFilter(country, selectedCountries, setSelectedCountries)}
                                                className={`cursor-pointer transition-all select-none ${selectedCountries.includes(country)
                                                    ? "bg-[#8ae4ff] text-black border-[#8ae4ff]"
                                                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                                                    }`}
                                            >
                                                {country}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Year Filter */}
                                <div>
                                    <p className='text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2'>
                                        <Calendar className="h-3.5 w-3.5" />
                                        Năm phát hành
                                    </p>
                                    <div className='flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar'>
                                        {yearOptions.map((year) => (
                                            <Badge
                                                key={`year-${year}`}
                                                onClick={() => toggleFilter(year, selectedYears, setSelectedYears)}
                                                className={`cursor-pointer transition-all select-none ${selectedYears.includes(year)
                                                    ? "bg-[#8ae4ff] text-black border-[#8ae4ff]"
                                                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                                                    }`}
                                            >
                                                {year}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {activeFilterCount > 0 && (
                                <Button
                                    onClick={clearFilters}
                                    variant='ghost'
                                    className='mt-4 text-[#8ae4ff] hover:text-[#8ae4ff]/80 hover:bg-[#8ae4ff]/10 w-full sm:w-auto'
                                >
                                    <X className='h-4 w-4 mr-2' />
                                    Xóa bộ lọc ({activeFilterCount})
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Results Grid */}
                <div>
                    {isLoading || isPaginating ? (
                        <div className='flex flex-col items-center justify-center py-20'>
                            <Loader2 className='h-12 w-12 text-[#8ae4ff] animate-spin mb-4' />
                            <p className='text-gray-400'>Đang tải...</p>
                        </div>
                    ) : movies.length > 0 ? (
                        <>
                            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
                                {movies.map((movie) => (
                                    <MovieCard
                                        key={movie.id}
                                        movie={movie}
                                    />
                                ))}
                            </div>
                            {pagination.totalPages > 1 && (
                                <PaginationControls
                                    pagination={pagination}
                                    currentPage={currentPage}
                                    onPageChange={handlePageChange}
                                    isLoading={isPaginating}
                                />
                            )}
                        </>
                    ) : (
                        <div className='flex flex-col items-center justify-center py-20'>
                            <div className='p-6 bg-white/5 rounded-2xl border border-white/10 mb-4'>
                                <Film className='h-16 w-16 text-gray-600 mx-auto' />
                            </div>
                            <h3 className='text-xl font-semibold text-white mb-2'>
                                Không tìm thấy phim
                            </h3>
                            <p className='text-gray-400 text-center max-w-md'>
                                Hiện tại chưa có phim nào từ {displayValue}
                                {activeFilterCount > 0 &&
                                    " và các bộ lọc đã chọn. Hãy thử xóa bớt bộ lọc."}
                            </p>
                            {activeFilterCount > 0 && (
                                <Button
                                    onClick={clearFilters}
                                    className='mt-4 bg-[#8ae4ff] hover:bg-[#8ae4ff]/90 text-black rounded-xl font-semibold'
                                >
                                    <X className='h-4 w-4 mr-2' />
                                    Xóa bộ lọc
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <div className='h-8' />
        </>
    );
}
