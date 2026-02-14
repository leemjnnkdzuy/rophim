"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { MovieCard } from "@/app/components/common/MovieCard";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
	Search,
	Filter,
	X,
	Loader2,
	Film,
	TrendingUp,
	Clock,
	Sparkles,
} from "lucide-react";
import api from "@/app/utils/axios";
import { Movie } from "@/app/types/movie";

// Filter options
const SORT_OPTIONS = [
	{ value: "views", label: "Lượt xem", icon: TrendingUp },
	{ value: "rating", label: "Đánh giá", icon: Sparkles },
	{ value: "latest", label: "Mới nhất", icon: Clock },
];

export default function SearchPage() {
	const searchParams = useSearchParams();
	const initialQuery = searchParams.get("q") || "";

	const [searchQuery, setSearchQuery] = useState(initialQuery);
	const [inputValue, setInputValue] = useState(initialQuery);
	const [movies, setMovies] = useState<Movie[]>([]);
	const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);

	// Filter states
	const [showFilters, setShowFilters] = useState(false);
	const [selectedSort, setSelectedSort] = useState("views");
	const [selectedCountry, setSelectedCountry] = useState("Tất cả");
	const [selectedYear, setSelectedYear] = useState("Tất cả");
	const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
	const [yearOptions, setYearOptions] = useState<string[]>([]);

	// Fetch years on mount
	useEffect(() => {
		const fetchYears = async () => {
			try {
				const res = await api.get("/years");
				if (Array.isArray(res.data)) {
					setYearOptions(["Tất cả", ...res.data]);
				}
			} catch {
				console.error("Failed to fetch years");
			}
		};
		fetchYears();
	}, []);

	// Format episode like HomePage
	const formatEpisode = (film: Record<string, unknown>): string => {
		// Nếu là phim lẻ -> không hiện tập
		if (
			(film.formats as Array<{ name: string }>)?.some(
				(f) => f.name === "Phim lẻ",
			) ||
			(film.total_episodes as number) === 1
		) {
			return "";
		}

		const current = film.current_episode as string | undefined;
		const total = (film.total_episodes as number) || 0;

		if (!current) return total ? `${total} Tập` : "";

		// Xử lý các case hoàn thành
		const currentLower = current.toLowerCase();
		if (
			currentLower.includes("full") ||
			currentLower.includes("hoàn tất")
		) {
			return total ? `Hoàn Thành ${total} Tập` : "Hoàn Thành";
		}

		const num = parseInt(current.replace(/\D/g, ""));
		// Nếu tập hiện tại >= tổng số tập -> Hoàn Thành
		if (!isNaN(num) && total && total > 0) {
			return num >= total ?
				`Hoàn Thành ${total} Tập`
				: `Tập ${num}/${total}`;
		}
		return current;
	};

	// Search function
	const handleSearch = useCallback(async (query: string) => {
		if (!query.trim()) {
			setMovies([]);
			setFilteredMovies([]);
			setHasSearched(false);
			return;
		}

		setIsLoading(true);
		setHasSearched(true);
		setSearchQuery(query);

		try {
			// Call API to search films
			const response = await api.get("/films/search", {
				params: {
					q: query,
					limit: 100,
				},
			});

			const results: Movie[] =
				response.data.films?.map((film: Record<string, unknown>) => ({
					id: (film.slug as string) || "",
					title: (film.name as string) || "",
					originalTitle: (film.original_name as string) || "",
					year:
						(film.years as Array<{ name: string }>)?.[0]?.name ?
							parseInt(
								(film.years as Array<{ name: string }>)[0].name,
							)
							: new Date().getFullYear(),
					rating: (film.rating as number) || 0,
					quality: (film.quality as string) || "HD",
					episode: formatEpisode(film),
					backdrop: (film.thumb_url as string),
					genre:
						(film.genres as Array<{ name: string }>)?.map(
							(g) => g.name,
						) || [],
					country: (film.countries as Array<{ name: string }>)?.[0]?.name || "",
					duration: (film.time as string) || "N/A",
					views: (film.views as number)?.toString() || "0",
					language: (film.language as string) || "Vietsub",
					description: (film.description as string) || "",
				})) || [];

			setMovies(results);
			setFilteredMovies(results);
		} catch (error) {
			console.error("Error searching films:", error);
			setMovies([]);
			setFilteredMovies([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		let filtered = [...movies];

		if (selectedCountry !== "Tất cả") {
			filtered = filtered.filter((m) => m.country === selectedCountry);
		}

		if (selectedYear !== "Tất cả") {
			filtered = filtered.filter(
				(m) => m.year.toString() === selectedYear,
			);
		}

		if (selectedGenres.length > 0) {
			filtered = filtered.filter((m) =>
				selectedGenres.some((genre) => m.genre.includes(genre)),
			);
		}

		// Sort
		filtered.sort((a, b) => {
			switch (selectedSort) {
				case "views":
					return parseInt(b.views) - parseInt(a.views);
				case "rating":
					return b.rating - a.rating;
				case "latest":
					return b.year - a.year;
				default:
					return 0;
			}
		});

		setFilteredMovies(filtered);
	}, [movies, selectedSort, selectedCountry, selectedYear, selectedGenres]);

	// Search on initial load if query exists
	useEffect(() => {
		if (initialQuery) {
			handleSearch(initialQuery);
		}
	}, [initialQuery, handleSearch]);

	// Handle form submit
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSearch(inputValue);
	};

	// Clear search
	const handleClear = () => {
		setInputValue("");
		setSearchQuery("");
		setMovies([]);
		setFilteredMovies([]);
		setHasSearched(false);
	};

	// Toggle genre filter
	const toggleGenre = (genre: string) => {
		setSelectedGenres((prev) =>
			prev.includes(genre) ?
				prev.filter((g) => g !== genre)
				: [...prev, genre],
		);
	};

	// Get unique genres & countries from results
	const availableGenres = Array.from(
		new Set(movies.flatMap((m) => m.genre)),
	).sort();

	const availableCountries = Array.from(
		new Set(movies.map((m) => m.country).filter(Boolean)),
	).sort();

	return (
		<div className='min-h-screen bg-[#0a0a0f] text-white'>
			<div className='w-full px-4 lg:px-32 py-8'>
				{/* Search Header */}
				<div className='mb-8'>
					<div className='flex items-center gap-3 mb-4'>
						<div>
							<h1 className='text-3xl font-bold'>
								Tìm Kiếm Phim
							</h1>
							<p className='text-gray-400 text-sm mt-1'>
								Khám phá hàng ngàn bộ phim hấp dẫn
							</p>
						</div>
					</div>

					{/* Search Bar */}
					<form onSubmit={handleSubmit} className='relative'>
						<div className='relative'>
							<Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500' />
							<Input
								type='text'
								placeholder='Nhập tên phim, diễn viên, đạo diễn...'
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								className='w-full pl-12 pr-24 h-14 bg-white/5 border-white/10 rounded-2xl text-base text-white placeholder:text-gray-500 focus-visible:ring-[#8ae4ff]/30 hover:bg-white/8 transition-colors'
							/>
							<div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2'>
								{inputValue && (
									<Button
										type='button'
										onClick={handleClear}
										variant='ghost'
										size='icon'
										className='h-8 w-8 rounded-full hover:bg-white/10'
									>
										<X className='h-4 w-4' />
									</Button>
								)}
								<Button
									type='submit'
									disabled={isLoading || !inputValue.trim()}
									className='h-10 px-6 bg-[#8ae4ff] hover:bg-[#8ae4ff]/90 text-black rounded-xl font-semibold shadow-lg shadow-[#8ae4ff]/20 transition-all duration-300'
								>
									{isLoading ?
										<Loader2 className='h-4 w-4 animate-spin' />
										: "Tìm"}
								</Button>
							</div>
						</div>
					</form>
				</div>

				{/* Filter Bar */}
				{hasSearched && movies.length > 0 && (
					<div className='mb-6'>
						<div className='flex items-center justify-between mb-4'>
							<div className='flex items-center gap-3'>
								<Button
									onClick={() => setShowFilters(!showFilters)}
									variant='outline'
									className='border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-lg'
								>
									<Filter className='h-4 w-4 mr-2' />
									Bộ lọc
									{(selectedCountry !== "Tất cả" ||
										selectedYear !== "Tất cả" ||
										selectedGenres.length > 0) && (
											<Badge className='ml-2 bg-[#8ae4ff] text-black text-xs px-1.5 py-0 border-0'>
												{(selectedCountry !== "Tất cả" ? 1
													: 0) +
													(selectedYear !== "Tất cả" ? 1
														: 0) +
													selectedGenres.length}
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
													setSelectedSort(
														option.value,
													)
												}
												variant='outline'
												className={`border-white/10 rounded-lg transition-all ${(
														selectedSort ===
														option.value
													) ?
														"bg-[#8ae4ff]/20 border-[#8ae4ff]/50 text-[#8ae4ff]"
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
									{filteredMovies.length}
								</span>{" "}
								kết quả
								{searchQuery && (
									<>
										{" "}
										cho &ldquo;
										<span className='text-white font-medium'>
											{searchQuery}
										</span>
										&rdquo;
									</>
								)}
							</p>
						</div>

						{/* Filter Panel */}
						{showFilters && (
							<div className='p-4 bg-white/5 border border-white/10 rounded-xl mb-4 animate-in slide-in-from-top-2'>
								<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
									{/* Country Filter */}
									<div>
										<p className='text-sm font-semibold text-gray-400 mb-2'>
											Quốc gia
										</p>
										<div className='flex flex-wrap gap-2'>
											{["Tất cả", ...availableCountries].map((country) => (
												<Badge
													key={`country-${country}`}
													onClick={() =>
														setSelectedCountry(
															country as string,
														)
													}
													className={`cursor-pointer transition-all ${(
															selectedCountry ===
															country
														) ?
															"bg-[#8ae4ff] text-black border-[#8ae4ff]"
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
										<p className='text-sm font-semibold text-gray-400 mb-2'>
											Năm phát hành
										</p>
										<div className='flex flex-wrap gap-2 max-h-32 overflow-y-auto'>
											{yearOptions.map((year) => (
												<Badge
													key={year}
													onClick={() =>
														setSelectedYear(year)
													}
													className={`cursor-pointer transition-all ${selectedYear === year ?
															"bg-[#8ae4ff] text-black border-[#8ae4ff]"
															: "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
														}`}
												>
													{year}
												</Badge>
											))}
										</div>
									</div>

									{/* Genre Filter */}
									<div>
										<p className='text-sm font-semibold text-gray-400 mb-2'>
											Thể loại
										</p>
										<div className='flex flex-wrap gap-2 max-h-20 overflow-y-auto'>
											{availableGenres.map((genre) => (
												<Badge
													key={genre}
													onClick={() =>
														toggleGenre(genre)
													}
													className={`cursor-pointer transition-all ${(
															selectedGenres.includes(
																genre,
															)
														) ?
															"bg-[#8ae4ff] text-black border-[#8ae4ff]"
															: "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
														}`}
												>
													{genre}
												</Badge>
											))}
										</div>
									</div>
								</div>

								{/* Clear Filters */}
								{(selectedCountry !== "Tất cả" ||
									selectedYear !== "Tất cả" ||
									selectedGenres.length > 0) && (
										<Button
											onClick={() => {
												setSelectedCountry("Tất cả");
												setSelectedYear("Tất cả");
												setSelectedGenres([]);
											}}
											variant='ghost'
											className='mt-3 text-[#8ae4ff] hover:text-[#8ae4ff]/80 hover:bg-[#8ae4ff]/10'
										>
											<X className='h-4 w-4 mr-2' />
											Xóa bộ lọc
										</Button>
									)}
							</div>
						)}
					</div>
				)}

				{/* Results */}
				<div>
					{isLoading ?
						<div className='flex flex-col items-center justify-center py-20'>
							<Loader2 className='h-12 w-12 text-[#8ae4ff] animate-spin mb-4' />
							<p className='text-gray-400'>Đang tìm kiếm...</p>
						</div>
						: filteredMovies.length > 0 ?
							<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4'>
								{filteredMovies.map((movie) => (
									<MovieCard key={movie.id} movie={movie} />
								))}
							</div>
							: hasSearched ?
								<div className='flex flex-col items-center justify-center py-20'>
									<div className='p-6 bg-white/5 rounded-2xl border border-white/10 mb-4'>
										<Film className='h-16 w-16 text-gray-600 mx-auto' />
									</div>
									<h3 className='text-xl font-semibold mb-2'>
										Không tìm thấy kết quả
									</h3>
									<p className='text-gray-400 text-center max-w-md'>
										Không tìm thấy phim nào phù hợp với từ khóa
										&ldquo;
										<span className='text-white font-medium'>
											{searchQuery}
										</span>
										&rdquo;. Vui lòng thử lại với từ khóa khác.
									</p>
								</div>
								: <div className='flex flex-col items-center justify-center py-20'>
									<div className='p-6 bg-gradient-to-br from-[#8ae4ff]/20 to-[#8ae4ff]/5 rounded-2xl border border-[#8ae4ff]/20 mb-4'>
										<Search className='h-16 w-16 text-[#8ae4ff] mx-auto' />
									</div>
									<h3 className='text-xl font-semibold mb-2'>
										Bắt đầu tìm kiếm
									</h3>
									<p className='text-gray-400 text-center max-w-md'>
										Nhập tên phim, diễn viên hoặc đạo diễn để tìm
										kiếm phim yêu thích của bạn
									</p>
								</div>
					}
				</div>
			</div>
		</div>
	);
}
