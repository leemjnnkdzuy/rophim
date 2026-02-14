"use client";

import React, {useState, useEffect, useRef} from "react";
import Image from "next/image";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Button} from "@/app/components/ui/button";
import {Badge} from "@/app/components/ui/badge";
import {
	Play,
	Star,
	Clock,
	TrendingUp,
	ChevronRight,
	Eye,
	Flame,
	Zap,
	ChevronLeft,
	Film,
} from "lucide-react";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/app/components/ui/tabs";
import {fetchLatestFilmsFromDB, MovieItem} from "@/app/services/movieService";
import {Movie, FeaturedMovie} from "@/app/types/movie";

import {SectionTitle} from "@/app/components/common/SectionTitle";
import {MovieCard} from "@/app/components/common/MovieCard";
import {HeroCategorySection} from "@/app/components/common/HeroCategorySection";
import {SplitCategorySection} from "@/app/components/common/SplitCategorySection";
import {SingleMovieSection} from "@/app/components/common/SingleMovieSection";
import {LoadingScreen} from "@/app/components/common/LoadingScreen";

// --- Main Page ---

export default function HomePage() {
	const router = useRouter();
	const [currentSlide, setCurrentSlide] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [featuredMoviesData, setFeaturedMoviesData] = useState<
		FeaturedMovie[]
	>([]);
	const [categoryMovies, setCategoryMovies] = useState<{
		trending: Movie[];
		china: Movie[];
		korea: Movie[];
		western: Movie[];
		series: Movie[];
		single: Movie[];
		cartoon: Movie[];
		genres: string[];
	}>({
		trending: [],
		china: [],
		korea: [],
		western: [],
		series: [],
		single: [],
		cartoon: [],
		genres: [],
	});

	const scrollContainerRef = useRef<HTMLDivElement>(null);

	type MovieItemWithStats = MovieItem & {
		rating?: number;
		views?: number;
		current_episode?: string;
	};

	const scroll = (direction: "left" | "right") => {
		if (scrollContainerRef.current) {
			const scrollAmount = 300; // Adjust as needed
			if (direction === "left") {
				scrollContainerRef.current.scrollBy({
					left: -scrollAmount,
					behavior: "smooth",
				});
			} else {
				scrollContainerRef.current.scrollBy({
					left: scrollAmount,
					behavior: "smooth",
				});
			}
		}
	};

	useEffect(() => {
		const loadMovies = async () => {
			try {
				const data = await fetchLatestFilmsFromDB();

				const formatEpisode = (item: MovieItemWithStats) => {
					// Nếu là phim lẻ -> không hiện tập
					if (
						item.formats?.some((f) => f.name === "Phim lẻ") ||
						item.total_episodes === 1
					)
						return "";

					const current = item.current_episode;
					const total = item.total_episodes;

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
							:	`Tập ${num}/${total}`;
					}
					return current;
				};

				const mapToMovie = (
					item: MovieItemWithStats,
					idx: number,
				): FeaturedMovie => ({
					id: item.slug || idx + 1000,
					title: item.name,
					originalTitle: item.original_name,
					year:
						(
							item.years &&
							Array.isArray(item.years) &&
							item.years.length > 0 &&
							item.years[0].name
						) ?
							parseInt(item.years[0].name)
						: item.created ? new Date(item.created).getFullYear()
						: new Date().getFullYear(),
					rating: item.rating || 0,
					quality: item.quality,
					poster: item.poster_url,
					genre: item.genres?.map((g) => g.name) || ["Phim Mới"],
					duration: item.time || "N/A",
					views: item.views ? item.views.toLocaleString() : "New",
					description: item.description,
					backdrop: item.thumb_url,
					episode: formatEpisode(item),
					isNew: true,
					language: item.language,
				});

				if (data) {
					// 1. Hero / Featured (Latest Uploads)
					const latest = (data.latestMovies || []).map(mapToMovie);
					if (latest.length > 0) setFeaturedMoviesData(latest);

					// 2. Lists
					// Override poster with thumb_url for specific categories as requested
					const trending = (data.trendingMovies || []).map(
						(item, idx) => ({
							...mapToMovie(item, idx),
							poster: item.thumb_url || item.poster_url,
							isTrending: true,
						}),
					);

					const china = (data.chinaMovies || []).map((item, idx) => ({
						...mapToMovie(item, idx),
						poster: item.thumb_url || item.poster_url,
					}));

					const korea = (data.koreaMovies || []).map((item, idx) => ({
						...mapToMovie(item, idx),
						poster: item.thumb_url || item.poster_url,
					}));

					const western = (data.westernMovies || []).map(
						(item, idx) => ({
							...mapToMovie(item, idx),
							poster: item.thumb_url || item.poster_url,
						}),
					);
					const series = (data.seriesMovies || []).map(mapToMovie);
					const single = (data.singleMovies || []).map(mapToMovie);
					const cartoon = (data.cartoonMovies || []).map(mapToMovie);
					const genres = data.allGenres || [];

					setCategoryMovies({
						trending,
						china,
						korea,
						western,
						series,
						single,
						cartoon,
						genres,
					});
					setIsLoading(false);
				}
			} catch (error) {
				console.error(
					"Failed to load new movies for hero section",
					error,
				);
				setIsLoading(false);
			}
		};
		loadMovies();
	}, []);

	// Auto-advance slide every 5 seconds
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentSlide((prev) => (prev + 1) % featuredMoviesData.length);
		}, 5000);
		return () => clearInterval(timer);
	}, [featuredMoviesData.length]);

	const featuredMovie = featuredMoviesData[currentSlide];

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!featuredMovie) return null;

	return (
		<>
			{/* Hero Section */}
			<section className='relative overflow-hidden transition-all duration-500 ease-in-out h-[1000px] lg:h-[700px] flex items-center'>
				{/* Background */}
				<div className='absolute inset-0 bg-neutral-950' />
				<div className='absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(138,228,255,0.15),transparent)]' />

				{/* Dynamic Background Image with Overlay */}
				{featuredMovie.poster && (
					<div className='absolute inset-0 opacity-20'>
						<Image
							src={featuredMovie.poster}
							alt='Backdrop'
							fill
							sizes='100vw'
							unoptimized
							className='object-cover'
						/>
						<div className='absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent' />
					</div>
				)}

				<div className='relative w-full px-4 lg:px-32 py-8 lg:py-16'>
					<div className='grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-center'>
						{/* Hero Info Container */}
						<div className='flex flex-col gap-6 max-w-2xl'>
							{/* Animating Content */}
							<div
								className='space-y-5 animate-in fade-in slide-in-from-left-5 duration-500'
								key={featuredMovie.id}
							>
								<div className='flex items-center gap-3 flex-wrap'>
									<Badge className='bg-primary text-black text-xs font-bold border-0 px-3 py-1'>
										<Flame className='h-3 w-3 mr-1' />
										PHIM VỪA CẬP NHẬT
									</Badge>
									<Badge
										variant='outline'
										className='border-white/20 text-gray-400 text-xs px-3 py-1'
									>
										{featuredMovie.year}
									</Badge>
									{featuredMovie.rating > 0 && (
										<Badge
											variant='outline'
											className='border-primary/30 text-primary text-xs px-3 py-1'
										>
											<Star className='h-3 w-3 mr-1 fill-primary' />
											{featuredMovie.rating}
										</Badge>
									)}
								</div>

								<h1 className='text-4xl lg:text-6xl font-black text-white leading-tight'>
									{featuredMovie.title}
								</h1>

								<p className='text-sm text-primary/80 font-medium tracking-wide'>
									{featuredMovie.originalTitle}
								</p>

								<div className='flex items-center gap-4 text-sm text-gray-400 flex-wrap'>
									<span className='flex items-center gap-1.5'>
										<Clock className='h-4 w-4' />
										{featuredMovie.duration}
									</span>
									<span className='flex items-center gap-1.5'>
										<Eye className='h-4 w-4' />
										{featuredMovie.views} lượt xem
									</span>
									<span className='text-primary font-medium'>
										{featuredMovie.episode}
									</span>
								</div>

								<div className='flex flex-wrap gap-2'>
									{featuredMovie.genre.map((g) => (
										<Badge
											key={g}
											variant='outline'
											className='border-white/10 text-gray-300 hover:bg-white/5 transition-colors text-xs'
										>
											{g}
										</Badge>
									))}
								</div>

								<p className='text-gray-400 leading-relaxed text-sm lg:text-base line-clamp-3'>
									{featuredMovie.description}
								</p>

								<div className='flex items-center gap-3 pt-2'>
									<Button
										size='lg'
										onClick={() =>
											router.push(
												`/info/${featuredMovie.id}`,
											)
										}
										className='bg-primary hover:bg-primary/90 text-black rounded-full px-8 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 h-12 cursor-pointer'
									>
										<Play
											className='h-5 w-5 mr-2'
											fill='black'
										/>
										Xem Ngay
									</Button>
								</div>
							</div>
						</div>

						{/* Hero Poster */}
						<div
							className='hidden lg:block relative animate-in fade-in duration-1000'
							key={`poster-${featuredMovie.id}`}
						>
							<div className='absolute -inset-4 bg-primary/20 rounded-2xl blur-2xl' />
							<div className='relative w-[300px] aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/10'>
								{featuredMovie.backdrop ?
									<Image
										src={featuredMovie.backdrop}
										alt={featuredMovie.title}
										fill
										sizes='300px'
										unoptimized
										className='object-cover'
									/>
								:	<div className='absolute inset-0 bg-neutral-900/60 flex items-center justify-center'>
										<div className='text-center'>
											<Film className='h-16 w-16 text-white/20 mx-auto mb-3' />
											<p className='text-white/40 text-sm font-medium'>
												{featuredMovie.title}
											</p>
										</div>
									</div>
								}
								<div className='absolute top-3 left-3'>
									<Badge className='bg-primary/90 text-black font-bold border-0 px-2 py-1 text-xs backdrop-blur-sm'>
										{featuredMovie.quality}
									</Badge>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* Navigation Dots - Centered Bottom */}
				<div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20'>
					{featuredMoviesData.map((_, index) => (
						<button
							key={index}
							onClick={() => setCurrentSlide(index)}
							className={`h-1.5 rounded-full transition-all duration-300 ${
								currentSlide === index ? "w-8 bg-primary" : (
									"w-2 bg-white/20 hover:bg-white/40"
								)
							}`}
							aria-label={`Go to slide ${index + 1}`}
						/>
					))}
				</div>
			</section>

			{/* Trending Section */}
			<section className='w-full px-4 lg:px-32 py-10'>
				<SectionTitle
					title='Phim Thịnh Hành'
					icon={<TrendingUp className='h-5 w-5' />}
					href='/thinh-hanh'
				/>
				<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5'>
					{categoryMovies.trending.map((movie) => (
						<MovieCard key={movie.id} movie={movie} />
					))}
				</div>
			</section>

			{/* Categories Quick Access */}
			<section className='w-full px-4 lg:px-32 py-10 relative group'>
				<SectionTitle
					title='Khám Phá Theo Thể Loại'
					icon={<Zap className='h-5 w-5' />}
				/>

				<div className='relative'>
					{/* Navigation Buttons */}
					<button
						onClick={() => scroll("left")}
						className='cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-primary hover:text-black text-white p-3 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 -ml-4 shadow-xl border border-white/10'
						aria-label='Scroll left'
					>
						<ChevronLeft className='h-6 w-6' />
					</button>

					<button
						onClick={() => scroll("right")}
						className='cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-primary hover:text-black text-white p-3 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 -mr-4 shadow-xl border border-white/10'
						aria-label='Scroll right'
					>
						<ChevronRight className='h-6 w-6' />
					</button>

					<div
						ref={scrollContainerRef}
						className='flex gap-4 overflow-x-auto scroll-smooth py-4 px-2 select-none'
						style={{
							scrollbarWidth: "none",
							msOverflowStyle: "none",
						}}
					>
						<style jsx>{`
							div::-webkit-scrollbar {
								display: none;
							}
						`}</style>
						{categoryMovies.genres
							.filter(Boolean)
							.map((genre, index) => {
								const gradients = [
									"from-primary/10 to-primary/5",
									"from-pink-400 to-rose-600",
									"from-purple-400 to-violet-600",
									"from-cyan-400 to-blue-600",
									"from-emerald-400 to-teal-600",
									"from-amber-400 to-orange-600",
									"from-indigo-400 to-purple-600",
									"from-lime-400 to-green-600",
									"from-fuchsia-400 to-pink-600",
								];
								const gradient =
									gradients[index % gradients.length];

								return (
									<Link
										key={`${genre}-${index}`}
										href={`/the-loai/${genre.toLowerCase().replace(/\s/g, "-")}`}
										className={`
                                        relative flex items-center justify-center 
                                        min-w-[180px] h-[100px] 
                                        rounded-2xl 
                                        bg-gradient-to-br ${gradient}
                                        shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1
                                        transition-all duration-300 group
                                        overflow-hidden
                                    `}
									>
										<div className='absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 to-transparent opacity-100' />

										<span className='relative z-10 text-lg font-bold text-white drop-shadow-md text-center px-2'>
											{genre}
										</span>
									</Link>
								);
							})}
					</div>
				</div>
			</section>

			{/* Phim Bộ Mới Section - Premium */}
			<HeroCategorySection
				movies={categoryMovies.series}
				title='Phim Bộ Mới'
				href='/danh-sach/phim-bo'
				icon={<Film className='h-5 w-5' />}
			/>

			{/* Country Movies Tabbed Section */}
			<section className='w-full px-4 lg:px-32 py-10'>
				<Tabs defaultValue='china' className='w-full'>
					<div className='flex items-center justify-between mb-6'>
						<div className='flex items-center gap-3'>
							<h2 className='text-xl font-bold text-white'>
								Phim Mới Cập Nhật
							</h2>
						</div>
						<TabsList className='inline-flex h-9 items-center justify-center rounded-lg bg-white/5 p-1 text-gray-400'>
							<TabsTrigger
								value='china'
								className='inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-sm'
							>
								Trung Quốc
							</TabsTrigger>
							<TabsTrigger
								value='korea'
								className='inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-sm'
							>
								Hàn Quốc
							</TabsTrigger>
							<TabsTrigger
								value='western'
								className='inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-sm'
							>
								Âu Mỹ
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value='china' className='mt-0'>
						<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5'>
							{categoryMovies.china.map((movie) => (
								<MovieCard key={movie.id} movie={movie} />
							))}
						</div>
					</TabsContent>

					<TabsContent value='korea' className='mt-0'>
						<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5'>
							{categoryMovies.korea.map((movie) => (
								<MovieCard key={movie.id} movie={movie} />
							))}
						</div>
					</TabsContent>

					<TabsContent value='western' className='mt-0'>
						<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5'>
							{categoryMovies.western.map((movie) => (
								<MovieCard key={movie.id} movie={movie} />
							))}
						</div>
					</TabsContent>
				</Tabs>
			</section>

			{/* Phim Hoạt Hình Section */}
			<SplitCategorySection
				movies={categoryMovies.cartoon}
				title='Phim Hoạt Hình'
				icon={<Zap className='h-5 w-5' />}
				href='/the-loai/hoat-hinh'
			/>

			{/* Phim Lẻ Mới Section - Cinema Showcase */}
			<SingleMovieSection movies={categoryMovies.single} />
		</>
	);
}
