"use client";

import React, {useState, useEffect, useMemo, useCallback, useRef} from "react";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {Button} from "@/app/components/ui/button";
import {Badge} from "@/app/components/ui/badge";
import {Tabs, TabsList, TabsTrigger} from "@/app/components/ui/tabs";
import {
	Play,
	Star,
	ChevronLeft,
	ChevronRight,
	Tv,
	Film,
	Loader2,
	AlertCircle,
	MessageCircle,
	Share2,
	Heart,
	Bookmark,
	Home,
	Info,
	ChevronDown,
	ChevronUp,
	Server,
} from "lucide-react";
import {
	fetchFilmDetail,
	FilmDetail,
	EpisodeServer,
	EpisodeItem,
	incrementView,
} from "@/app/services/movieService";
import api from "@/app/utils/axios";
import {useAuth} from "@/app/hooks/useAuth";
import {useGlobalNotificationPopup} from "@/app/hooks/useGlobalNotificationPopup";
import {usePageMetadata} from "@/app/hooks/usePageMetadata";
import RatingPopup from "@/app/components/common/RatingPopup";

// ─── Skeleton ──────────────────────────────────────────────
function WatchPageSkeleton() {
	return (
		<div className='min-h-screen animate-pulse'>
			{/* Player Skeleton */}
			<div className='w-full aspect-video bg-neutral-900 flex items-center justify-center'>
				<Loader2 className='h-12 w-12 text-primary animate-spin' />
			</div>
			{/* Info Skeleton */}
			<div className='px-4 lg:px-32 py-6 space-y-4'>
				<div className='h-8 w-3/4 bg-neutral-800 rounded-lg' />
				<div className='h-5 w-1/2 bg-neutral-800 rounded-lg' />
				<div className='flex gap-3'>
					<div className='h-7 w-20 bg-neutral-800 rounded-md' />
					<div className='h-7 w-20 bg-neutral-800 rounded-md' />
					<div className='h-7 w-24 bg-neutral-800 rounded-md' />
				</div>
				<div className='grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-2 mt-6'>
					{Array.from({length: 24}).map((_, i) => (
						<div
							key={i}
							className='h-11 bg-neutral-800 rounded-lg'
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function WatchPageError({
	message,
	onRetry,
}: {
	message: string;
	onRetry: () => void;
}) {
	return (
		<div className='min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4'>
			<div className='w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center'>
				<AlertCircle className='h-10 w-10 text-red-400' />
			</div>
			<h2 className='text-xl font-bold text-white'>
				Không thể phát phim
			</h2>
			<p className='text-gray-400 text-sm text-center max-w-md'>
				{message}
			</p>
			<Button
				onClick={onRetry}
				className='bg-primary hover:bg-primary/90 text-black rounded-full px-6 font-semibold cursor-pointer'
			>
				Thử lại
			</Button>
		</div>
	);
}

// ─── Main Component ────────────────────────────────────────
export default function WatchPage({
	identifier,
	episodeSlug,
}: {
	identifier?: string;
	episodeSlug?: string;
}) {
	const router = useRouter();
	const {isAuthenticated} = useAuth();
	const {showNotification} = useGlobalNotificationPopup();
	const [film, setFilm] = useState<FilmDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeServerIdx, setActiveServerIdx] = useState(0);
	const [activeEpSlug, setActiveEpSlug] = useState<string>(episodeSlug || "");
	const [isEpListExpanded, setIsEpListExpanded] = useState(true);
	const [viewIncremented, setViewIncremented] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [showRatingPopup, setShowRatingPopup] = useState(false);
	const [userRating, setUserRating] = useState<number | null>(null);
	const playerRef = useRef<HTMLDivElement>(null);

	const slug = identifier || "";

	const loadFilm = useCallback(async () => {
		if (!slug) {
			setError("Không tìm thấy slug phim.");
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const data = await fetchFilmDetail(slug);
			setFilm(data);

			// Auto-select first episode if no episode slug is provided
			if (!episodeSlug && data.episodes?.[0]?.items?.[0]) {
				setActiveEpSlug(data.episodes[0].items[0].slug);
			}
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ?
					err.message
				:	"Có lỗi xảy ra khi tải thông tin phim.";
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	}, [slug, episodeSlug]);

	useEffect(() => {
		loadFilm();
	}, [loadFilm]);

	usePageMetadata(film ? `Xem ${film.name} - RapPhim` : null);

	useEffect(() => {
		const loadSavedStatus = async () => {
			if (!slug || !isAuthenticated) {
				setIsSaved(false);
				return;
			}

			try {
				const response = await api.get(`/user/saved?slug=${slug}`);
				setIsSaved(!!response.data?.isSaved);
			} catch {
				setIsSaved(false);
			}
		};

		loadSavedStatus();
	}, [slug, isAuthenticated]);

	// Increment view once when page loads
	useEffect(() => {
		if (film && !viewIncremented) {
			incrementView(film.slug);
			setViewIncremented(true);
		}
	}, [film, viewIncremented]);

	// Track watch history when episode changes
	useEffect(() => {
		const trackWatchHistory = async () => {
			if (!film || !activeEpSlug || !isAuthenticated) return;

			// Find the current episode name
			const server = film.episodes?.[activeServerIdx];
			const ep = server?.items?.find((e) => e.slug === activeEpSlug);
			if (!ep) return;

			try {
				await api.post("/user/history", {
					filmSlug: film.slug,
					episodeSlug: ep.slug,
					episodeName: ep.name,
					serverIdx: activeServerIdx,
				});
			} catch {
				// Silently fail - don't interrupt viewing experience
			}
		};

		trackWatchHistory();
	}, [film, activeEpSlug, activeServerIdx, isAuthenticated]);

	const loadUserRating = useCallback(async () => {
		if (!slug || !isAuthenticated) return;
		try {
			const response = await api.get(`/user/films/${slug}`);
			if (response.data?.success) {
				setUserRating(response.data.userRating);
			}
		} catch {
			// Silently fail
		}
	}, [slug, isAuthenticated]);

	useEffect(() => {
		loadUserRating();
	}, [loadUserRating]);

	const handleRatingSubmit = (
		rating: number,
		filmAverage?: number | null,
	) => {
		setUserRating(rating);
		if (typeof filmAverage === "number" && film) {
			setFilm({...film, rating: filmAverage});
		}
		setShowRatingPopup(false);
	};

	// Find current episode
	const activeServer: EpisodeServer | null =
		film?.episodes?.[activeServerIdx] || null;

	const currentEpisode: EpisodeItem | null = useMemo(() => {
		if (!activeServer) return null;
		return (
			activeServer.items.find((ep) => ep.slug === activeEpSlug) ||
			activeServer.items[0] ||
			null
		);
	}, [activeServer, activeEpSlug]);

	const currentEpIndex = useMemo(() => {
		if (!activeServer || !currentEpisode) return -1;
		return activeServer.items.findIndex(
			(ep) => ep.slug === currentEpisode.slug,
		);
	}, [activeServer, currentEpisode]);

	const handleToggleSave = async () => {
		if (!slug) return;
		if (!isAuthenticated) {
			showNotification("Vui lòng đăng nhập để lưu phim", "warning");
			router.push("/sign-in");
			return;
		}

		if (isSaving) return;

		try {
			setIsSaving(true);
			const response = await api.post("/user/saved", {
				slug,
				action: isSaved ? "remove" : "add",
			});
			const nextSaved = !!response.data?.isSaved;
			setIsSaved(nextSaved);
			showNotification(
				nextSaved ? "Đã lưu phim" : "Đã bỏ lưu phim",
				"success",
			);
		} catch {
			showNotification("Không thể lưu phim", "error");
		} finally {
			setIsSaving(false);
		}
	};

	// Navigation helpers
	const hasPrevEp = currentEpIndex > 0;
	const hasNextEp =
		activeServer ? currentEpIndex < activeServer.items.length - 1 : false;

	const goToEpisode = (ep: EpisodeItem) => {
		setActiveEpSlug(ep.slug);
		playerRef.current?.scrollIntoView({behavior: "smooth"});
	};

	const goPrevEp = () => {
		if (hasPrevEp && activeServer) {
			goToEpisode(activeServer.items[currentEpIndex - 1]);
		}
	};

	const goNextEp = () => {
		if (hasNextEp && activeServer) {
			goToEpisode(activeServer.items[currentEpIndex + 1]);
		}
	};

	// Categories
	const categories = useMemo(() => {
		if (!film?.category) return {};
		const result: Record<string, {id: string; name: string}[]> = {};
		Object.values(film.category).forEach(
			(cat: {
				group?: {name: string};
				list?: {id: string; name: string}[];
			}) => {
				const groupName = cat?.group?.name;
				if (groupName && cat?.list) {
					result[groupName] = cat.list;
				}
			},
		);
		return result;
	}, [film]);

	const countries = categories["Quốc gia"] || [];

	if (loading) return <WatchPageSkeleton />;
	if (error || !film)
		return (
			<WatchPageError
				message={error || "Phim không tồn tại."}
				onRetry={loadFilm}
			/>
		);

	return (
		<div className='min-h-screen bg-background'>
			{/* ─── Video Player ───────────────────── */}
			<div ref={playerRef} className='w-full bg-black'>
				<div className='max-w-[1400px] mx-auto'>
					<div className='relative w-full aspect-video bg-black rounded-b-2xl overflow-hidden shadow-2xl shadow-black/50'>
						{currentEpisode?.embed ?
							<iframe
								key={currentEpisode.slug}
								src={currentEpisode.embed}
								className='absolute inset-0 w-full h-full'
								allowFullScreen
								allow='autoplay; encrypted-media; picture-in-picture'
								title={`${film.name} - ${currentEpisode.name}`}
							/>
						:	<div className='absolute inset-0 flex flex-col items-center justify-center gap-4'>
								<div className='w-20 h-20 rounded-full bg-white/5 flex items-center justify-center'>
									<Film className='h-10 w-10 text-white/20' />
								</div>
								<p className='text-gray-500 text-sm'>
									Không có nguồn phát cho tập này.
								</p>
							</div>
						}
					</div>
				</div>
			</div>

			{/* ─── Player Controls Bar ───────────── */}
			<div className='w-full bg-[#0a0a12]/80 backdrop-blur-xl border-b border-white/5'>
				<div className='max-w-[1400px] mx-auto px-4 lg:px-8 py-3'>
					<div className='flex items-center justify-between flex-wrap gap-3'>
						{/* Left: Episode Navigation */}
						<div className='flex items-center gap-2'>
							<Button
								variant='outline'
								size='sm'
								disabled={!hasPrevEp}
								onClick={goPrevEp}
								className='border-white/10 text-gray-300 hover:bg-white/10 hover:text-white rounded-full h-9 px-3 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all'
							>
								<ChevronLeft className='h-4 w-4 mr-1' />
								Tập trước
							</Button>
							<div className='px-3 py-1 bg-primary/10 border border-primary/20 rounded-full'>
								<span className='text-sm font-bold text-primary'>
									{currentEpisode?.name || "—"}
								</span>
							</div>
							<Button
								variant='outline'
								size='sm'
								disabled={!hasNextEp}
								onClick={goNextEp}
								className='border-white/10 text-gray-300 hover:bg-white/10 hover:text-white rounded-full h-9 px-3 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all'
							>
								Tập sau
								<ChevronRight className='h-4 w-4 ml-1' />
							</Button>
						</div>

						<div className='flex items-center gap-2'>
							<Button
								onClick={() => setShowRatingPopup(true)}
								size='sm'
								className='bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-full shadow-lg shadow-amber-500/20 h-9 px-3 cursor-pointer transition-all'
							>
								<Star className='h-4 w-4 mr-1.5 fill-black' />
								Đánh giá phim
							</Button>
							<Button
								variant='outline'
								size='icon'
								className='border-white/10 text-gray-400 hover:bg-white/10 hover:text-white rounded-full h-9 w-9 cursor-pointer transition-all'
							>
								<Heart className='h-4 w-4' />
							</Button>
							<Button
								variant='outline'
								size='icon'
								className='border-white/10 text-gray-400 hover:bg-white/10 hover:text-white rounded-full h-9 w-9 cursor-pointer transition-all'
							>
								<Share2 className='h-4 w-4' />
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* ─── Content Section ───────────────── */}
			<div className='max-w-[1400px] mx-auto px-4 lg:px-8 py-6'>
				<div className='grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6'>
					{/* ─── Left: Film Info + Episodes ── */}
					<div className='space-y-6'>
						{/* Server Selector + Episode Grid */}
						<div className='space-y-4'>
							<div className='flex items-center justify-between flex-wrap gap-3'>
								<button
									onClick={() =>
										setIsEpListExpanded(!isEpListExpanded)
									}
									className='flex items-center gap-2 cursor-pointer group'
								>
									<Tv className='h-5 w-5 text-primary' />
									<h3 className='text-lg font-bold text-white group-hover:text-primary transition-colors'>
										Danh sách tập
									</h3>
									{isEpListExpanded ?
										<ChevronUp className='h-4 w-4 text-gray-500 group-hover:text-primary transition-colors' />
									:	<ChevronDown className='h-4 w-4 text-gray-500 group-hover:text-primary transition-colors' />
									}
								</button>

								{/* Server Tabs */}
								{film.episodes && film.episodes.length > 1 && (
									<Tabs
										value={String(activeServerIdx)}
										onValueChange={(v) =>
											setActiveServerIdx(Number(v))
										}
									>
										<TabsList className='bg-white/5 border border-white/10 h-8 p-0.5'>
											{film.episodes.map(
												(server, idx) => (
													<TabsTrigger
														key={idx}
														value={String(idx)}
														className='data-[state=active]:bg-primary data-[state=active]:text-black h-full px-3 rounded-md transition-all font-medium text-xs'
													>
														<Server className='h-3 w-3 mr-1' />
														{server.server_name}
													</TabsTrigger>
												),
											)}
										</TabsList>
									</Tabs>
								)}
							</div>

							{/* Episode Grid */}
							{(
								isEpListExpanded &&
								activeServer &&
								activeServer.items.length > 0
							) ?
								<div className='grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2'>
									{activeServer.items.map((ep) => {
										const isActive =
											ep.slug === currentEpisode?.slug;
										return (
											<button
												key={ep.slug}
												onClick={() => goToEpisode(ep)}
												className={`
                                                    relative h-11 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group overflow-hidden
                                                    ${
														isActive ?
															"bg-primary text-black font-bold shadow-lg shadow-primary/25 ring-2 ring-primary/50"
														:	"bg-white/5 border border-white/10 text-gray-300 hover:bg-primary/15 hover:border-primary/30 hover:text-primary"
													}
                                                `}
											>
												<span className='relative z-10 flex items-center justify-center gap-1'>
													{isActive && (
														<Play
															className='h-3 w-3'
															fill='currentColor'
														/>
													)}
													{ep.name}
												</span>
												{!isActive && (
													<div className='absolute inset-0 bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
												)}
											</button>
										);
									})}
								</div>
							: isEpListExpanded ?
								<div className='flex flex-col items-center justify-center py-12 gap-3 bg-white/[0.02] rounded-xl border border-white/5'>
									<Film className='h-10 w-10 text-white/10' />
									<p className='text-gray-500 text-sm'>
										Chưa có tập phim nào.
									</p>
								</div>
							:	null}
						</div>
					</div>

					{/* ─── Right: Sidebar ─────────────── */}
					<div className='space-y-5'>
						{/* Film Poster Card */}
						<div className='bg-white/[0.03] rounded-2xl border border-white/5 overflow-hidden'>
							<div className='relative aspect-video overflow-hidden'>
								<Image
									src={film.poster_url}
									alt={film.name}
									fill
									className='object-cover'
								/>
								<div className='absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-transparent to-transparent' />
								<div className='absolute bottom-3 left-3 right-3'>
									<Badge className='bg-primary/90 text-black text-[10px] font-bold border-0 px-2 py-0.5 shadow-sm'>
										Đang xem: {currentEpisode?.name}
									</Badge>
								</div>
							</div>
							<div className='p-4 space-y-3'>
								<h4 className='text-sm font-bold text-white line-clamp-2'>
									{film.name}
								</h4>
								<div className='space-y-2'>
									<InfoRow
										label='Đạo diễn'
										value={film.director || "Đang cập nhật"}
									/>
									<InfoRow
										label='Thời lượng'
										value={film.time || "N/A"}
									/>
									<InfoRow
										label='Ngôn ngữ'
										value={film.language || "N/A"}
									/>
									{countries.length > 0 && (
										<InfoRow
											label='Quốc gia'
											value={countries
												.map((c) => c.name)
												.join(", ")}
										/>
									)}
									<InfoRow
										label='Chất lượng'
										value={film.quality}
									/>
									<InfoRow
										label='Tập'
										value={`${film.current_episode || "?"} / ${film.total_episodes || "?"}`}
									/>
								</div>
							</div>
						</div>

						{/* Cast */}
						{film.casts && (
							<div className='bg-white/[0.03] rounded-2xl border border-white/5 p-4 space-y-3'>
								<h4 className='text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2'>
									<Star className='h-3.5 w-3.5 text-primary' />
									Diễn viên
								</h4>
								<div className='flex flex-wrap gap-1.5'>
									{film.casts
										.split(",")
										.slice(0, 8)
										.map((cast, i) => (
											<span
												key={i}
												className='text-[11px] text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5'
											>
												{cast.trim()}
											</span>
										))}
								</div>
							</div>
						)}

						{/* Quick Actions */}
						<div className='bg-white/[0.03] rounded-2xl border border-white/5 p-4 space-y-3'>
							<h4 className='text-sm font-bold text-white uppercase tracking-wider'>
								Hành động
							</h4>
							<div className='grid grid-cols-2 gap-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										router.push(`/info/${film.slug}`)
									}
									className='border-white/10 text-gray-300 hover:bg-white/10 hover:text-white rounded-lg h-10 cursor-pointer transition-all w-full text-xs'
								>
									<Info className='h-3.5 w-3.5 mr-1.5' />
									Chi tiết phim
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() => router.push("/")}
									className='border-white/10 text-gray-300 hover:bg-white/10 hover:text-white rounded-lg h-10 cursor-pointer transition-all w-full text-xs'
								>
									<Home className='h-3.5 w-3.5 mr-1.5' />
									Trang chủ
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={handleToggleSave}
									className='border-white/10 text-gray-300 hover:bg-white/10 hover:text-white rounded-lg h-10 cursor-pointer transition-all w-full text-xs'
								>
									<Bookmark className='h-3.5 w-3.5 mr-1.5' />
									{isSaved ? "Đã lưu" : "Lưu phim"}
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='border-white/10 text-gray-300 hover:bg-white/10 hover:text-white rounded-lg h-10 cursor-pointer transition-all w-full text-xs'
								>
									<MessageCircle className='h-3.5 w-3.5 mr-1.5' />
									Bình luận
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Rating Popup */}
			{showRatingPopup && (
				<RatingPopup
					filmSlug={slug}
					currentRating={userRating || undefined}
					averageRating={film?.rating}
					onClose={() => setShowRatingPopup(false)}
					onRatingSubmit={handleRatingSubmit}
				/>
			)}
		</div>
	);
}

// ─── Sub Components ────────────────────────────────────────
function InfoRow({label, value}: {label: string; value: string}) {
	return (
		<div className='flex items-center justify-between gap-3'>
			<span className='text-[11px] text-gray-500 font-medium uppercase tracking-wider shrink-0'>
				{label}
			</span>
			<span className='text-xs text-gray-300 text-right truncate'>
				{value}
			</span>
		</div>
	);
}
