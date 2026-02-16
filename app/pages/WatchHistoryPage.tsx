"use client";

import React, {useEffect, useMemo, useState, useCallback} from "react";
import {useRouter} from "next/navigation";
import Image from "next/image";
import {History, Film, Loader2, Play, Clock, AlertCircle} from "lucide-react";
import {SectionTitle} from "@/app/components/common/SectionTitle";
import {Button} from "@/app/components/ui/button";
import {Badge} from "@/app/components/ui/badge";
import {useAuth} from "@/app/hooks/useAuth";
import {getUserWatchHistory} from "@/app/services/UserService";

interface WatchHistoryEntry {
	filmSlug: string;
	episodeSlug: string;
	episodeName: string;
	serverIdx: number;
	watchedAt: string;
	film: {
		name: string;
		slug: string;
		original_name?: string;
		thumb_url?: string;
		poster_url?: string;
		total_episodes?: number;
		time?: string;
		quality?: string;
		language?: string;
		rating?: number;
		views?: number;
		genres?: {id: string; name: string}[];
		years?: {id: string; name: string}[];
	};
}

function formatTimeAgo(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMin = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMin < 1) return "Vừa xong";
	if (diffMin < 60) return `${diffMin} phút trước`;
	if (diffHours < 24) return `${diffHours} giờ trước`;
	if (diffDays < 7) return `${diffDays} ngày trước`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
	return date.toLocaleDateString("vi-VN");
}

function groupByDate(
	entries: WatchHistoryEntry[],
): {label: string; items: WatchHistoryEntry[]}[] {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today.getTime() - 86400000);
	const thisWeek = new Date(today.getTime() - 7 * 86400000);
	const thisMonth = new Date(today.getTime() - 30 * 86400000);

	const groups: {label: string; items: WatchHistoryEntry[]}[] = [
		{label: "Hôm nay", items: []},
		{label: "Hôm qua", items: []},
		{label: "Tuần này", items: []},
		{label: "Tháng này", items: []},
		{label: "Trước đó", items: []},
	];

	entries.forEach((entry) => {
		const date = new Date(entry.watchedAt);
		if (date >= today) {
			groups[0].items.push(entry);
		} else if (date >= yesterday) {
			groups[1].items.push(entry);
		} else if (date >= thisWeek) {
			groups[2].items.push(entry);
		} else if (date >= thisMonth) {
			groups[3].items.push(entry);
		} else {
			groups[4].items.push(entry);
		}
	});

	return groups.filter((g) => g.items.length > 0);
}

export default function WatchHistoryPage() {
	const router = useRouter();
	const {isAuthenticated, loading} = useAuth();
	const [isFetching, setIsFetching] = useState(true);
	const [history, setHistory] = useState<WatchHistoryEntry[]>([]);
	const [error, setError] = useState<string | null>(null);

	const fetchHistory = useCallback(async () => {
		if (loading) return;
		if (!isAuthenticated) {
			setIsFetching(false);
			return;
		}

		try {
			setIsFetching(true);
			const historyData = await getUserWatchHistory();
			setHistory(historyData as unknown as WatchHistoryEntry[]);
			setError(null);
		} catch {
			setError("Không thể tải lịch sử xem phim.");
		} finally {
			setIsFetching(false);
		}
	}, [isAuthenticated, loading]);

	useEffect(() => {
		fetchHistory();
	}, [fetchHistory]);

	const groupedHistory = useMemo(() => groupByDate(history), [history]);

	if (loading || isFetching) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<Loader2 className='h-10 w-10 text-primary animate-spin' />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className='min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center'>
				<div className='w-20 h-20 rounded-full bg-white/5 flex items-center justify-center'>
					<History className='h-10 w-10 text-primary/80' />
				</div>
				<h2 className='text-xl font-bold text-white'>
					Đăng nhập để xem lịch sử
				</h2>
				<p className='text-sm text-gray-400 max-w-md'>
					Bạn cần đăng nhập để theo dõi lịch sử xem phim và tiếp tục
					từ nơi bạn đã dừng.
				</p>
				<Button
					className='bg-primary hover:bg-primary/90 text-black rounded-full px-6 font-semibold cursor-pointer'
					onClick={() => router.push("/sign-in")}
				>
					Đăng nhập
				</Button>
			</div>
		);
	}

	return (
		<section className='w-full px-4 lg:px-32 py-10'>
			<div className='flex items-center justify-between flex-wrap gap-4 mb-6'>
				<SectionTitle title='Lịch sử xem phim' />
			</div>

			{error ?
				<div className='flex flex-col items-center justify-center gap-3 py-12'>
					<AlertCircle className='h-10 w-10 text-red-400' />
					<p className='text-gray-400 text-sm'>{error}</p>
					<Button
						variant='outline'
						className='border-white/10 text-gray-300 hover:bg-white/10 cursor-pointer'
						onClick={fetchHistory}
					>
						Thử lại
					</Button>
				</div>
			: history.length === 0 ?
				<div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
					<div className='w-16 h-16 rounded-full bg-white/5 flex items-center justify-center'>
						<Film className='h-8 w-8 text-white/30' />
					</div>
					<h3 className='text-lg font-semibold text-white'>
						Chưa có lịch sử xem phim
					</h3>
					<p className='text-sm text-gray-400'>
						Xem phim để tạo lịch sử và dễ dàng tiếp tục từ nơi bạn
						đã dừng.
					</p>
					<Button
						variant='outline'
						className='border-white/10 text-gray-300 hover:bg-white/10 cursor-pointer'
						onClick={() => router.push("/")}
					>
						Khám phá phim mới
					</Button>
				</div>
			:	<div className='space-y-8'>
					{groupedHistory.map((group) => (
						<div key={group.label} className='space-y-3'>
							<h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2'>
								<Clock className='h-4 w-4' />
								{group.label}
							</h3>
							<div className='space-y-2'>
								{group.items.map((entry) => (
									<WatchHistoryCard
										key={entry.filmSlug}
										entry={entry}
										onContinue={() =>
											router.push(
												`/xem/${entry.filmSlug}/${entry.episodeSlug}`,
											)
										}
										onInfo={() =>
											router.push(
												`/info/${entry.filmSlug}`,
											)
										}
									/>
								))}
							</div>
						</div>
					))}
				</div>
			}
		</section>
	);
}

// ─── Watch History Card ────────────────────────────────────
function WatchHistoryCard({
	entry,
	onContinue,
	onInfo,
}: {
	entry: WatchHistoryEntry;
	onContinue: () => void;
	onInfo: () => void;
}) {
	const film = entry.film;

	return (
		<div className='group relative flex gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200'>
			{/* Poster */}
			<div
				onClick={onInfo}
				className='relative flex-shrink-0 w-[100px] sm:w-[120px] aspect-[2/3] rounded-lg overflow-hidden cursor-pointer group/poster'
			>
				{film.thumb_url || film.poster_url ?
					<Image
						src={film.thumb_url || film.poster_url || ""}
						alt={film.name}
						fill
						sizes='120px'
						unoptimized
						className='object-cover group-hover/poster:scale-105 transition-transform duration-300'
					/>
				:	<div className='absolute inset-0 bg-neutral-800 flex items-center justify-center'>
						<Film className='h-8 w-8 text-white/20' />
					</div>
				}
				{film.quality && (
					<Badge className='absolute top-1.5 left-1.5 bg-primary/90 text-black text-[9px] font-bold border-0 px-1.5 py-0.5'>
						{film.quality}
					</Badge>
				)}
				{/* Play overlay */}
				<div className='absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity duration-200'>
					<div className='w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center'>
						<Play
							className='h-4 w-4 text-black ml-0.5'
							fill='black'
						/>
					</div>
				</div>
			</div>

			{/* Info */}
			<div className='flex-1 min-w-0 flex flex-col justify-between py-1'>
				<div className='space-y-1.5'>
					<h4
						onClick={onInfo}
						className='text-base font-bold text-white line-clamp-1 cursor-pointer hover:text-primary transition-colors'
					>
						{film.name}
					</h4>
					{film.original_name && film.original_name !== film.name && (
						<p className='text-xs text-gray-500 line-clamp-1'>
							{film.original_name}
						</p>
					)}

					{/* Last watched badge */}
					<div className='flex items-center gap-2 flex-wrap'>
						<Badge className='bg-primary/15 text-primary border border-primary/30 text-xs font-semibold px-2 py-0.5 rounded-md'>
							<Play
								className='h-3 w-3 mr-1'
								fill='currentColor'
							/>
							Đang xem: {entry.episodeName || entry.episodeSlug}
						</Badge>
						<span className='text-[11px] text-gray-500'>
							{formatTimeAgo(entry.watchedAt)}
						</span>
					</div>

					{/* Film meta */}
					<div className='flex items-center gap-2 flex-wrap'>
						{film.language && (
							<span className='text-[11px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-md'>
								{film.language}
							</span>
						)}
						{film.time && (
							<span className='text-[11px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-md'>
								{film.time}
							</span>
						)}
						{film.years && film.years.length > 0 && (
							<span className='text-[11px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-md'>
								{film.years[0].name}
							</span>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className='flex items-center gap-2 mt-3'>
					<Button
						size='sm'
						onClick={onContinue}
						className='bg-primary hover:bg-primary/90 text-black rounded-full px-4 h-8 font-bold text-xs cursor-pointer shadow-lg shadow-primary/20 transition-all'
					>
						<Play className='h-3.5 w-3.5 mr-1' fill='black' />
						Tiếp tục xem
					</Button>
				</div>
			</div>
		</div>
	);
}
