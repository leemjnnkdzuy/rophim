"use client";

import React, {useCallback, useState, useEffect, useMemo} from "react";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {Button} from "@/app/components/ui/button";
import {Badge} from "@/app/components/ui/badge";
import {Tabs, TabsList, TabsTrigger} from "@/app/components/ui/tabs";
import {
	Play,
	Star,
	Clock,
	ChevronDown,
	Share2,
	Bookmark,
	Film,
	User,
	Calendar,
	Globe,
	Tag,
	Info,
	Tv,
	CheckCircle2,
	AlertCircle,
	Eye,
	Volume2,
} from "lucide-react";
import {
	fetchFilmDetail,
	FilmDetail,
	EpisodeServer,
	incrementView,
} from "@/app/services/movieService";
import type {CategoryGroup} from "@/app/services/movieService";
import api from "@/app/utils/axios";
import {useAuth} from "@/app/hooks/useAuth";
import {useGlobalNotificationPopup} from "@/app/hooks/useGlobalNotificationPopup";
import {usePageMetadata} from "@/app/hooks/usePageMetadata";
import RatingPopup from "@/app/components/common/RatingPopup";

function getCategories(category: Record<string, CategoryGroup>) {
	const result: Record<string, {id: string; name: string}[]> = {};
	if (!category) return result;
	Object.values(category).forEach((cat) => {
		const groupName = cat?.group?.name;
		if (groupName && cat?.list) {
			result[groupName] = cat.list;
		}
	});
	return result;
}

function formatEpisodeStatus(currentEp: string, totalEp: number) {
	if (!currentEp) return {text: `${totalEp} Tập`, isComplete: false};

	const lower = currentEp.toLowerCase();
	if (lower.includes("full") || lower.includes("hoàn tất")) {
		return {text: `Hoàn Thành ${totalEp} Tập`, isComplete: true};
	}

	const num = parseInt(currentEp.replace(/\D/g, ""));
	if (!isNaN(num) && totalEp && totalEp > 0) {
		if (num >= totalEp)
			return {text: `Hoàn Thành ${totalEp} Tập`, isComplete: true};
		return {text: `Tập ${num}/${totalEp}`, isComplete: false};
	}

	return {text: currentEp, isComplete: false};
}

function InfoPageSkeleton() {
	return (
		<div className='min-h-screen animate-pulse'>
			<div className='relative h-[500px] bg-neutral-900'>
				<div className='absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent' />
				<div className='absolute bottom-0 left-0 right-0 px-4 lg:px-32 pb-8'>
					<div className='flex gap-8'>
						<div className='hidden lg:block w-[220px] aspect-[2/3] rounded-2xl bg-neutral-800' />
						<div className='flex-1 space-y-4 py-4'>
							<div className='h-10 w-3/4 bg-neutral-800 rounded-lg' />
							<div className='h-5 w-1/2 bg-neutral-800 rounded-lg' />
							<div className='flex gap-3'>
								<div className='h-7 w-20 bg-neutral-800 rounded-md' />
								<div className='h-7 w-20 bg-neutral-800 rounded-md' />
								<div className='h-7 w-24 bg-neutral-800 rounded-md' />
							</div>
							<div className='h-12 w-40 bg-neutral-800 rounded-full' />
						</div>
					</div>
				</div>
			</div>
			<div className='px-4 lg:px-32 py-8 space-y-6'>
				<div className='flex gap-3'>
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className='h-10 w-24 bg-neutral-800 rounded-lg'
						/>
					))}
				</div>
				<div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2'>
					{Array.from({length: 20}).map((_, i) => (
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

function InfoPageError({
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
				Không tìm thấy phim
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

export default function InfoPage({identifier}: {identifier?: string}) {
	const router = useRouter();
	const {isAuthenticated} = useAuth();
	const {showNotification} = useGlobalNotificationPopup();
	const [film, setFilm] = useState<FilmDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeServerIdx, setActiveServerIdx] = useState(0);
	const [isDescExpanded, setIsDescExpanded] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [showRatingPopup, setShowRatingPopup] = useState(false);
	const [userRating, setUserRating] = useState<number | null>(null);
	const [lastWatchedEp, setLastWatchedEp] = useState<{
		episodeSlug: string;
		episodeName: string;
		serverIdx: number;
	} | null>(null);

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
		} catch (err) {
			setError(
				err instanceof Error ?
					err.message
				:	"Có lỗi xảy ra khi tải thông tin phim.",
			);
		} finally {
			setLoading(false);
		}
	}, [slug]);

	useEffect(() => {
		setActiveServerIdx(0);
		setIsDescExpanded(false);
		loadFilm();
	}, [loadFilm]);

	usePageMetadata(film ? `${film.name} - RapPhim` : null);

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

	// Load last watched episode from history
	useEffect(() => {
		const loadWatchHistory = async () => {
			if (!slug || !isAuthenticated) {
				setLastWatchedEp(null);
				return;
			}
			try {
				const response = await api.get(`/user/history?slug=${slug}`);
				if (response.data?.found && response.data.lastWatched) {
					setLastWatchedEp({
						episodeSlug: response.data.lastWatched.episodeSlug,
						episodeName: response.data.lastWatched.episodeName,
						serverIdx: response.data.lastWatched.serverIdx,
					});
				} else {
					setLastWatchedEp(null);
				}
			} catch {
				setLastWatchedEp(null);
			}
		};

		loadWatchHistory();
	}, [slug, isAuthenticated]);

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

	const categories = useMemo(
		() => (film ? getCategories(film.category) : {}),
		[film],
	);
	const genres = categories["Thể loại"] || [];
	const countries = categories["Quốc gia"] || [];
	const formats = categories["Định dạng"] || [];
	const years = categories["Năm"] || [];

	const episodeStatus = useMemo(() => {
		if (!film) return {text: "", isComplete: false};
		return formatEpisodeStatus(film.current_episode, film.total_episodes);
	}, [film]);

	const activeServer: EpisodeServer | null =
		film?.episodes?.[activeServerIdx] || null;

	const languageStyle = useMemo(() => {
		if (!film?.language) return "";
		const lang = film.language.toLowerCase();
		if (lang.includes("vietsub") && lang.includes("thuyết minh")) {
			return "bg-green-500/15 text-green-400 border-green-500/30";
		}
		if (lang.includes("vietsub")) {
			return "bg-purple-500/15 text-purple-400 border-purple-500/30";
		}
		if (lang.includes("thuyết minh")) {
			return "bg-orange-500/15 text-orange-400 border-orange-500/30";
		}
		return "bg-white/10 text-gray-300 border-white/20";
	}, [film?.language]);

	if (loading) return <InfoPageSkeleton />;
	if (error || !film)
		return (
			<InfoPageError
				message={error || "Phim không tồn tại."}
				onRetry={loadFilm}
			/>
		);

	return (
		<>
			{/* Hero Backdrop */}
			<section className='relative overflow-hidden'>
				{/* Backdrop Image */}
				<div className='absolute inset-0 h-[520px] lg:h-[480px]'>
					<Image
						src={film.poster_url}
						alt={film.name}
						fill
						sizes='100vw'
						unoptimized
						loading='eager'
						priority
						className='object-cover object-top'
					/>
					<div className='absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent' />
					<div className='absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent' />
					<div className='absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-background via-background/40 to-transparent backdrop-blur-[2px]' />
				</div>

				{/* Content over backdrop */}
				<div className='relative px-4 lg:px-32 pt-8 lg:pt-16 pb-6'>
					<div className='flex flex-col lg:flex-row gap-6 lg:gap-10'>
						{/* Poster */}
						<div className='flex-shrink-0 mx-auto lg:mx-0'>
							<div className='relative group'>
								<div className='absolute -inset-2 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
								<div className='relative w-[180px] lg:w-[220px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group-hover:ring-primary/30 transition-all duration-300'>
									<Image
										src={film.thumb_url}
										alt={film.name}
										fill
										sizes='220px'
										unoptimized
										className='object-cover group-hover:scale-105 transition-transform duration-500'
									/>
									{/* Quality Badge */}
									<div className='absolute top-3 left-3 flex flex-col gap-1.5'>
										<Badge className='bg-primary/90 text-black text-xs font-bold border-0 px-2 py-0.5 shadow-sm backdrop-blur-sm'>
											{film.quality}
										</Badge>
									</div>
								</div>
							</div>
						</div>

						{/* Info */}
						<div className='flex-1 flex flex-col justify-end min-w-0 text-center lg:text-left pb-2'>
							<h1 className='text-3xl lg:text-5xl font-black text-white leading-tight mb-1.5'>
								{film.name}
							</h1>
							<p className='text-sm lg:text-base text-primary/70 font-medium tracking-wide mb-4'>
								{film.original_name}
							</p>

							{/* Meta Badges */}
							<div className='flex items-center gap-2 flex-wrap justify-center lg:justify-start mb-5'>
								{film.is_featured && (
									<Badge className='bg-red-500/90 text-white border-0 px-2.5 py-1 rounded-md text-xs font-bold shadow-lg shadow-red-500/20 animate-pulse'>
										Nổi Bật
									</Badge>
								)}
								{(film.rating || 0) > 0 && (
									<Badge className='bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0 px-2.5 py-1 rounded-md text-xs font-bold'>
										<Star className='h-3.5 w-3.5 mr-1 fill-amber-400' />
										{(film.rating || 0).toFixed(1)}
									</Badge>
								)}
								<Badge
									variant='outline'
									className='border-white/20 text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium'
								>
									<Eye className='h-3.5 w-3.5 mr-1' />
									{film.views ?
										film.views.toLocaleString()
									:	0}{" "}
									lượt xem
								</Badge>
								{years.length > 0 && (
									<Badge
										variant='outline'
										className='border-white/20 text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium'
									>
										<Calendar className='h-3 w-3 mr-1' />
										{years[0].name}
									</Badge>
								)}
								<Badge
									variant='outline'
									className='border-white/20 text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium'
								>
									<Clock className='h-3 w-3 mr-1' />
									{film.time || "N/A"}
								</Badge>
								<Badge
									variant='outline'
									className='border-white/20 text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium'
								>
									{film.quality}
								</Badge>
								{countries.length > 0 && (
									<Badge
										variant='outline'
										className='border-white/20 text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium'
									>
										<Globe className='h-3 w-3 mr-1' />
										{countries
											.map((c) => c.name)
											.join(", ")}
									</Badge>
								)}
							</div>

							{/* Episode Status */}
							<div className='mb-5 flex items-center gap-2 justify-center lg:justify-start'>
								<div
									className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
										episodeStatus.isComplete ?
											"bg-green-500/15 text-green-400 border border-green-500/30"
										:	"bg-primary/15 text-primary border border-primary/30"
									}`}
								>
									{episodeStatus.isComplete ?
										<CheckCircle2 className='h-4 w-4' />
									:	<Tv className='h-4 w-4' />}
									{episodeStatus.text}
								</div>
								{film.language && (
									<div
										className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${languageStyle}`}
									>
										<Volume2 className='h-4 w-4' />
										{film.language}
									</div>
								)}
							</div>

							{/* Actions */}
							<div className='flex items-center gap-3 flex-wrap justify-center lg:justify-start mb-5'>
								<Button
									size='lg'
									onClick={() => {
										if (film) {
											incrementView(film.slug);
											// Navigate to last watched episode if available, otherwise first episode
											if (lastWatchedEp) {
												router.push(
													`/xem/${film.slug}/${lastWatchedEp.episodeSlug}`,
												);
											} else {
												const firstEp =
													film.episodes?.[0]
														?.items?.[0];
												if (firstEp) {
													router.push(
														`/xem/${film.slug}/${firstEp.slug}`,
													);
												} else {
													const episodeSection =
														document.getElementById(
															"episode-list",
														);
													if (episodeSection) {
														episodeSection.scrollIntoView(
															{
																behavior:
																	"smooth",
															},
														);
													}
												}
											}
										}
									}}
									className='bg-primary hover:bg-primary/90 text-black rounded-full px-8 font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 h-12 cursor-pointer'
								>
									<Play
										className='h-5 w-5 mr-2'
										fill='black'
									/>
									{lastWatchedEp ?
										`Tiếp tục xem tập ${lastWatchedEp.episodeName || lastWatchedEp.episodeSlug}`
									:	"Xem Ngay"}
								</Button>

								<div className='flex items-center gap-2'>
									{isSaved ?
										<Button
											onClick={handleToggleSave}
											size='icon'
											className='bg-amber-500 hover:bg-amber-600 text-black rounded-full h-12 w-12 shadow-lg shadow-amber-500/20 transition-all duration-300'
										>
											<Bookmark className='h-5 w-5' />
										</Button>
									:	<Button
											variant='outline'
											size='icon'
											onClick={handleToggleSave}
											className='border-white/15 rounded-full h-11 w-11 cursor-pointer backdrop-blur-sm transition-all text-gray-300 hover:bg-white/10 hover:text-white'
										>
											<Bookmark className='h-5 w-5' />
										</Button>
									}
									<Button
										variant='outline'
										size='icon'
										className='border-white/15 text-gray-300 hover:bg-white/10 hover:text-white rounded-full h-11 w-11 cursor-pointer backdrop-blur-sm transition-all'
									>
										<Share2 className='h-5 w-5' />
									</Button>
								</div>
							</div>

							{/* Genres */}
							<div className='flex flex-wrap gap-2 justify-center lg:justify-start'>
								{genres.map((g) => (
									<Badge
										key={g.id}
										variant='outline'
										className='border-white/10 text-gray-300 hover:bg-white/5 hover:border-primary/30 transition-colors text-xs px-3 py-1 rounded-full cursor-pointer'
									>
										{g.name}
									</Badge>
								))}
								{formats.map((f) => (
									<Badge
										key={f.id}
										variant='outline'
										className='border-primary/20 text-primary/80 hover:bg-primary/5 transition-colors text-xs px-3 py-1 rounded-full cursor-pointer'
									>
										{f.name}
									</Badge>
								))}
							</div>
						</div>
					</div>
				</div>
				{/* Rating Request - Bottom Right of Hero */}
				<div className='absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 text-right hidden lg:flex'>
					<p className='text-xs text-white/70 italic max-w-[200px] leading-tight'>
						&quot;Tụi mình rất cần lượt đánh giá của bạn để mọi
						người có thể biết phim hay hay dở đó nhá!&quot;
					</p>
					<Button
						onClick={() => setShowRatingPopup(true)}
						size='sm'
						className='bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-full shadow-lg shadow-amber-500/20 cursor-pointer'
					>
						<Star className='h-4 w-4 mr-1 fill-black' />
						Đánh giá phim
					</Button>
				</div>
			</section>

			{/* Two-Column Content Section */}
			<section className='w-full px-4 lg:px-32 py-6'>
				<div className='grid grid-cols-1 lg:grid-cols-[30%_1fr] gap-6 lg:gap-8'>
					{/* LEFT COLUMN — Overview & Cast (30%) */}
					<div className='bg-white/[0.03] rounded-2xl p-6 border border-white/5 space-y-8 order-2 lg:order-1 h-fit'>
						{/* Description */}
						<div className='space-y-3'>
							<h3 className='text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide'>
								<Info className='h-4 w-4 text-primary' />
								Nội dung phim
							</h3>
							<div className='relative'>
								<p
									className={`text-gray-400 leading-relaxed text-sm ${!isDescExpanded ? "line-clamp-6" : ""}`}
								>
									{film.description || "Chưa có mô tả."}
								</p>
								{film.description &&
									film.description.length > 200 && (
										<button
											onClick={() =>
												setIsDescExpanded(
													!isDescExpanded,
												)
											}
											className='text-primary text-xs font-medium hover:underline mt-2 cursor-pointer flex items-center gap-1'
										>
											{isDescExpanded ?
												"Thu gọn"
											:	"Xem thêm"}
											<ChevronDown
												className={`h-3.5 w-3.5 transition-transform ${isDescExpanded ? "rotate-180" : ""}`}
											/>
										</button>
									)}
							</div>
						</div>

						<div className='w-full h-px bg-white/5' />

						{/* Info Details */}
						<div className='space-y-4'>
							<h3 className='text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide'>
								<Tag className='h-4 w-4 text-primary' />
								Thông tin chi tiết
							</h3>
							<div className='space-y-3'>
								<InfoRow
									label='Đạo diễn'
									value={film.director || "Đang cập nhật"}
								/>
								<InfoRow
									label='Thời lượng'
									value={film.time || "N/A"}
								/>
								<InfoRow
									label='Chất lượng'
									value={film.quality}
								/>
								<InfoRow
									label='Ngôn ngữ'
									value={film.language || "N/A"}
								/>
								<InfoRow
									label='Số tập'
									value={`${film.current_episode || "?"} / ${film.total_episodes || "?"}`}
								/>
								{countries.length > 0 && (
									<InfoRow
										label='Quốc gia'
										value={countries
											.map((c) => c.name)
											.join(", ")}
									/>
								)}
								{years.length > 0 && (
									<InfoRow
										label='Năm'
										value={years[0].name}
									/>
								)}
								<InfoRow
									label='Cập nhật'
									value={new Date(
										film.modified,
									).toLocaleDateString("vi-VN")}
								/>
							</div>
						</div>

						<div className='w-full h-px bg-white/5' />

						{/* Cast & Director */}
						<div className='space-y-5'>
							{/* Director */}
							{film.director && (
								<div className='space-y-3'>
									<h3 className='text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide'>
										<Film className='h-4 w-4 text-primary' />
										Đạo diễn
									</h3>
									<div className='inline-flex items-center gap-3 p-2.5 bg-white/5 border border-white/5 rounded-xl w-full'>
										<div className='w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0'>
											<Star className='h-3.5 w-3.5 text-amber-400' />
										</div>
										<span className='text-sm text-gray-300 font-medium truncate'>
											{film.director}
										</span>
									</div>
								</div>
							)}

							{/* Cast List */}
							<div className='space-y-3'>
								<h3 className='text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide'>
									<User className='h-4 w-4 text-primary' />
									Diễn viên
								</h3>
								{film.casts ?
									<div className='space-y-2'>
										{film.casts
											.split(",")
											.map((cast, i) => (
												<div
													key={i}
													className='flex items-center gap-2.5 p-2 bg-white/5 border border-white/5 rounded-lg hover:bg-white/[0.08] transition-colors group'
												>
													<div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors'>
														<User className='h-3.5 w-3.5 text-primary' />
													</div>
													<span className='text-sm text-gray-300 font-medium truncate'>
														{cast.trim()}
													</span>
												</div>
											))}
									</div>
								:	<p className='text-gray-500 text-sm py-2 text-center italic'>
										Chưa có thông tin diễn viên.
									</p>
								}
							</div>
						</div>
					</div>

					{/* RIGHT COLUMN — Episodes (70%) */}
					<div className='space-y-5 order-1 lg:order-2'>
						<div className='flex items-center justify-between flex-wrap gap-4 mb-2'>
							<h3
								id='episode-list'
								className='text-lg font-bold text-white flex items-center gap-2'
							>
								<Tv className='h-5 w-5 text-primary' />
								Danh sách tập phim
							</h3>

							{/* Server Selector */}
							{film.episodes && film.episodes.length > 1 && (
								<Tabs
									value={String(activeServerIdx)}
									onValueChange={(v) =>
										setActiveServerIdx(Number(v))
									}
								>
									<TabsList className='bg-white/5 border border-white/10 h-9 p-1'>
										{film.episodes.map((server, idx) => (
											<TabsTrigger
												key={idx}
												value={String(idx)}
												className='data-[state=active]:bg-primary data-[state=active]:text-black h-full px-4 rounded-md transition-all font-medium'
											>
												{server.server_name}
											</TabsTrigger>
										))}
									</TabsList>
								</Tabs>
							)}
						</div>

						{/* Episode Grid */}
						{activeServer && activeServer.items.length > 0 ?
							<div className='grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-8 xl:grid-cols-10 gap-2'>
								{activeServer.items.map((ep) => {
									const isLastWatched =
										lastWatchedEp?.episodeSlug === ep.slug;
									return (
										<button
											key={ep.slug}
											onClick={() =>
												router.push(
													`/xem/${film.slug}/${ep.slug}`,
												)
											}
											className={`relative h-11 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group ${
												isLastWatched ?
													"bg-primary/20 border border-primary/40 text-primary ring-1 ring-primary/30"
												:	"bg-white/5 border border-white/10 text-gray-300 hover:bg-primary/20 hover:border-primary/40 hover:text-primary"
											}`}
										>
											<span className='relative z-10 flex items-center justify-center gap-1'>
												{isLastWatched && (
													<Play
														className='h-3 w-3'
														fill='currentColor'
													/>
												)}
												{ep.name}
											</span>
											{!isLastWatched && (
												<div className='absolute inset-0 bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
											)}
										</button>
									);
								})}
							</div>
						:	<div className='flex flex-col items-center justify-center py-20 gap-3 bg-white/[0.02] rounded-2xl border border-white/5'>
								<Film className='h-12 w-12 text-white/10' />
								<p className='text-gray-500 text-sm'>
									Chưa có tập phim nào.
								</p>
							</div>
						}
					</div>
				</div>
			</section>

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
		</>
	);
}

// --- Sub Components ---
function InfoRow({label, value}: {label: string; value: string}) {
	return (
		<div className='flex items-start justify-between gap-4'>
			<span className='text-xs text-gray-500 font-medium shrink-0 uppercase tracking-wider'>
				{label}
			</span>
			<span className='text-sm text-gray-300 text-right'>{value}</span>
		</div>
	);
}
