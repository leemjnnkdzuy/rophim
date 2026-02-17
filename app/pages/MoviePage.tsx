"use client";

import React, {useState, useEffect, useCallback} from "react";
import {useSearchParams} from "next/navigation";
import {
	Film,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Sparkles,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import {SectionTitle} from "@/app/components/common/SectionTitle";
import {MovieCard} from "@/app/components/common/MovieCard";
import {LoadingScreen} from "@/app/components/common/LoadingScreen";
import {TrendingCarousel} from "@/app/components/common/TrendingCarousel";
import {Button} from "@/app/components/ui/button";
import {Badge} from "@/app/components/ui/badge";
import {Movie} from "@/app/types/movie";
import {mapFilmToMovie, ApiMovieItem} from "@/app/utils/movieMapper";
import {fetchMoviesPageData} from "@/app/services";

// ────── Interfaces ──────

interface PaginationInfo {
	page: number;
	limit: number;
	totalCount: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

// Local TrendingCarousel removed. Imported from @/app/components/common/TrendingCarousel

// ────────────────────────────────────────────
// STYLE 2: Newest — Simple Grid (like HomePage)
// ────────────────────────────────────────────

function NewestSpotlight({movies}: {movies: Movie[]}) {
	if (movies.length === 0) return null;

	return (
		<section className='w-full px-4 lg:px-32 py-10'>
			<SectionTitle title='Phim Lẻ Mới Nhất' />
			<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5'>
				{movies.map((movie) => (
					<MovieCard key={movie.id} movie={movie} preferBackdrop />
				))}
			</div>
		</section>
	);
}

// ────────────────────────────────────────────
// STYLE 3: Recently Uploaded — Simple Grid (like HomePage)
// ────────────────────────────────────────────

function RecentlyUploadedSection({movies}: {movies: Movie[]}) {
	if (movies.length === 0) return null;

	return (
		<section className='w-full px-4 lg:px-32 py-10'>
			<SectionTitle title='Phim Lẻ Mới Cập Nhật' />
			<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5'>
				{movies.map((movie) => (
					<MovieCard key={movie.id} movie={movie} preferBackdrop />
				))}
			</div>
		</section>
	);
}

// ────── Pagination Controls ──────

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
	const {totalPages, totalCount} = pagination;

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
				<span className='text-primary font-semibold'>
					{currentPage}
				</span>{" "}
				/ {totalPages} • Tổng{" "}
				<span className='text-white font-semibold'>
					{totalCount.toLocaleString()}
				</span>{" "}
				phim lẻ
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
					page === "..." ?
						<span
							key={`ellipsis-${idx}`}
							className='px-2 text-gray-500 text-sm select-none'
						>
							...
						</span>
					:	<Button
							key={page}
							variant='outline'
							size='icon'
							onClick={() => onPageChange(page)}
							disabled={isLoading}
							className={`h-9 w-9 border-white/10 transition-all cursor-pointer ${
								currentPage === page ?
									"bg-primary text-black border-primary font-bold shadow-lg shadow-primary/20"
								:	"bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
							}`}
						>
							{page}
						</Button>,
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

// ────── Main Page ──────

export default function MoviePage() {
	const searchParams = useSearchParams();
	const initialPage = parseInt(searchParams.get("page") || "1");

	const [isLoading, setIsLoading] = useState(true);
	const [isPaginating, setIsPaginating] = useState(false);
	const [currentPage, setCurrentPage] = useState(initialPage);

	const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
	const [newestByYear, setNewestByYear] = useState<Movie[]>([]);
	const [recentlyUploaded, setRecentlyUploaded] = useState<Movie[]>([]);
	const [allMovies, setAllMovies] = useState<Movie[]>([]);
	const [pagination, setPagination] = useState<PaginationInfo>({
		page: 1,
		limit: 24,
		totalCount: 0,
		totalPages: 1,
		hasNext: false,
		hasPrev: false,
	});

	const fetchInitialData = useCallback(async () => {
		try {
			setIsLoading(true);
			const data = await fetchMoviesPageData(currentPage, 24);

			setTrendingMovies(
				(data.trendingMovies || []).map((film) =>
					mapFilmToMovie(film as unknown as ApiMovieItem),
				),
			);
			setNewestByYear(
				(data.newestByYear || []).map((film) =>
					mapFilmToMovie(film as unknown as ApiMovieItem),
				),
			);
			setRecentlyUploaded(
				(data.recentlyUploaded || []).map((film) =>
					mapFilmToMovie(film as unknown as ApiMovieItem),
				),
			);
			setAllMovies(
				(data.allMovies || []).map((film) =>
					mapFilmToMovie(film as unknown as ApiMovieItem),
				),
			);
			setPagination(data.pagination);
		} catch (error) {
			console.error("Failed to load movie page data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [currentPage]);

	const fetchPaginatedData = useCallback(async (page: number) => {
		try {
			setIsPaginating(true);
			const data = await fetchMoviesPageData(page, 24);

			setAllMovies(
				data.allMovies.map((film) =>
					mapFilmToMovie(film as unknown as ApiMovieItem),
				),
			);
			setPagination(data.pagination);
			setCurrentPage(page);

			const url = new URL(window.location.href);
			if (page === 1) {
				url.searchParams.delete("page");
			} else {
				url.searchParams.set("page", page.toString());
			}
			window.history.pushState({}, "", url.toString());

			const section = document.getElementById("all-movies-section");
			if (section) {
				section.scrollIntoView({behavior: "smooth", block: "start"});
			}
		} catch (error) {
			console.error("Failed to load paginated data:", error);
		} finally {
			setIsPaginating(false);
		}
	}, []);

	useEffect(() => {
		fetchInitialData();
	}, [fetchInitialData]);

	const handlePageChange = (page: number) => {
		if (page < 1 || page > pagination.totalPages || isPaginating) return;
		fetchPaginatedData(page);
	};

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<>
			{/* Page Header */}
			<section className='relative overflow-hidden'>
				<div className='absolute inset-0 bg-neutral-950' />
				<div className='absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(138,228,255,0.12),transparent)]' />

				<div className='relative w-full px-4 lg:px-32 pt-10 pb-6'>
					<div className='flex items-center gap-4 mb-2'>
						<div>
							<h1 className='text-3xl lg:text-4xl font-black text-white'>
								Phim Lẻ
							</h1>
							<p className='text-gray-400 text-sm mt-1'>
								Ngồi xuống, bắp rang sẵn rồi — chọn phim lẻ hay
								và chill thôi nào!
							</p>
						</div>
					</div>

					<div className='flex items-center gap-3 mt-4 flex-wrap'>
						<Badge className='bg-primary/10 text-primary border-primary/20 px-3 py-1.5'>
							<Sparkles className='h-3.5 w-3.5 mr-1.5' />
							{pagination.totalCount.toLocaleString()} phim lẻ
						</Badge>
					</div>
				</div>
			</section>

			{/* Section 1: Trending — Ranked Horizontal Scroll */}
			{/* Section 1: Trending — Ranked Horizontal Scroll */}
			<TrendingCarousel
				movies={trendingMovies}
				title='Phim Lẻ Thịnh Hành'
				description='Được xem nhiều nhất tuần này'
			/>

			{/* Divider */}
			<div className='w-full px-4 lg:px-32'>
				<div className='border-t border-white/5' />
			</div>

			{/* Section 2: Newest — Spotlight + Grid */}
			<NewestSpotlight movies={newestByYear} />

			{/* Divider */}
			<div className='w-full px-4 lg:px-32'>
				<div className='border-t border-white/5' />
			</div>

			{/* Section 3: Recently Uploaded — Neon Glow Cards */}
			<RecentlyUploadedSection movies={recentlyUploaded} />

			{/* Divider */}
			<div className='w-full px-4 lg:px-32'>
				<div className='border-t border-white/5' />
			</div>

			{/* Section 4: All Movies — Paginated Grid */}
			<section
				id='all-movies-section'
				className='w-full px-4 lg:px-32 py-10 scroll-mt-20'
			>
				<SectionTitle title='Tất Cả Phim Lẻ' />

				{isPaginating ?
					<div className='flex flex-col items-center justify-center py-20'>
						<Loader2 className='h-10 w-10 text-primary animate-spin mb-4' />
						<p className='text-gray-400 text-sm'>Đang tải...</p>
					</div>
				: allMovies.length > 0 ?
					<>
						<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5'>
							{allMovies.map((movie) => (
								<MovieCard
									key={movie.id}
									movie={movie}
									preferBackdrop
								/>
							))}
						</div>
						<PaginationControls
							pagination={pagination}
							currentPage={currentPage}
							onPageChange={handlePageChange}
							isLoading={isPaginating}
						/>
					</>
				:	<div className='flex flex-col items-center justify-center py-20'>
						<div className='p-6 bg-white/5 rounded-2xl border border-white/10 mb-4'>
							<Film className='h-16 w-16 text-gray-600 mx-auto' />
						</div>
						<h3 className='text-xl font-semibold text-white mb-2'>
							Không có phim lẻ
						</h3>
						<p className='text-gray-400 text-center max-w-md'>
							Hiện tại chưa có phim lẻ nào trong cơ sở dữ liệu
						</p>
					</div>
				}
			</section>

			<div className='h-8' />
		</>
	);
}
