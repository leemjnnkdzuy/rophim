"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
	Film,
	Search,
	ChevronLeft,
	ChevronRight,
	Eye,
	RefreshCw,
	Star,
} from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { useGlobalNotificationPopup } from "@/app/hooks/useGlobalNotificationPopup";
import api from "@/app/utils/axios";

interface FilmItem {
	_id: string;
	name: string;
	slug: string;
	origin_name: string;
	poster_url: string;
	thumb_url: string;
	type: string;
	status: string;
	episode_current: string;
	year: number;
	view: number;
	public: boolean;
	rating: number;
	createdAt?: string | null;
}

interface NewFilm {
	name: string;
	slug: string;
	poster_url: string;
	modified?: Date;
}

interface FilmDetail {
	_id: string;
	name: string;
	slug: string;
	original_name: string;
	description: string;
	poster_url: string;
	thumb_url: string;
	type: string;
	year: number;
	genres: string[];
	countries: string[];
	director: string;
	casts: string;
	quality: string;
	language: string;
	time: string;
	total_episodes: number;
	rating: number;
	views: number;
	public: boolean;
	created: string | null;
	modified: string | null;
	episode_current?: string;
}

export default function FilmsDashboards() {
	const [films, setFilms] = useState<FilmItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isUpdating, setIsUpdating] = useState(false);
	const [newFilms, setNewFilms] = useState<NewFilm[]>([]);
	const [showNewFilmsModal, setShowNewFilmsModal] = useState(false);
	const [selectedFilm, setSelectedFilm] = useState<FilmDetail | null>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [loadingDetail, setLoadingDetail] = useState(false);
	const { showNotification } = useGlobalNotificationPopup();

	const fetchFilms = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.get("/admin/films", {
				params: { page, limit: 20, search: searchQuery },
			});
			setFilms(res.data.films || []);
			setTotalPages(res.data.totalPages || 1);
		} catch (error) {
			console.error("Failed to fetch films:", error);
			showNotification(
				"Không thể tải danh sách phim. Vui lòng thử lại.",
				"error",
			);
		} finally {
			setLoading(false);
		}
	}, [page, searchQuery, showNotification]);

	useEffect(() => {
		fetchFilms();
	}, [fetchFilms]);

	const handleSearch = () => {
		setPage(1);
		fetchFilms();
	};

	const handleTogglePublic = async (
		filmId: string,
		currentPublic: boolean,
	) => {
		const newPublic = !currentPublic;

		try {
			const res = await api.patch("/admin/films", {
				filmId,
				public: newPublic,
			});

			if (res.data.success) {
				// Update local state
				setFilms((prevFilms) =>
					prevFilms.map((film) =>
						film._id === filmId ?
							{ ...film, public: newPublic }
							: film,
					),
				);

				// Show success notification
				showNotification(
					res.data.message ||
					`Đã ${newPublic ? "công khai" : "ẩn"} phim thành công`,
					"success",
				);
			} else {
				showNotification(
					res.data.message || "Không thể cập nhật trạng thái phim",
					"error",
				);
			}
		} catch (error) {
			console.error("Failed to toggle public status:", error);
			showNotification(
				"Đã có lỗi xảy ra khi cập nhật trạng thái phim",
				"error",
			);
		}
	};

	const handleUpdateFilms = async () => {
		setIsUpdating(true);
		setNewFilms([]);

		try {
			showNotification("Đang cập nhật phim mới từ nguồn...", "info");

			const res = await api.post("/admin/films/update");

			if (res.data.success) {
				const addedFilms = res.data.films || [];
				setNewFilms(addedFilms);

				if (addedFilms.length > 0) {
					setShowNewFilmsModal(true);
					showNotification(
						res.data.message ||
						`Đã thêm ${addedFilms.length} phim mới`,
						"success",
					);
					// Refresh film list
					await fetchFilms();
				} else {
					showNotification("Không có phim mới để cập nhật", "info");
				}
			} else {
				showNotification(
					res.data.message || "Không thể cập nhật phim",
					"error",
				);
			}
		} catch (error) {
			console.error("Failed to update films:", error);
			showNotification("Đã có lỗi xảy ra khi cập nhật phim", "error");
		} finally {
			setIsUpdating(false);
		}
	};

	const handleViewFilmDetails = async (filmSlug: string) => {
		setLoadingDetail(true);
		try {
			const res = await api.get(`/admin/films/${filmSlug}`);
			if (res.data.success) {
				setSelectedFilm(res.data.film);
				setShowDetailModal(true);
			} else {
				showNotification(
					res.data.message || "Không thể tải chi tiết phim",
					"error",
				);
			}
		} catch (error) {
			console.error("Failed to fetch film details:", error);
			showNotification("Đã có lỗi xảy ra khi tải chi tiết phim", "error");
		} finally {
			setLoadingDetail(false);
		}
	};

	return (
		<div className='space-y-6'>
			{/* Page Header */}
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-bold text-white flex items-center gap-2'>
						<Film className='h-6 w-6 text-primary' />
						Quản lý phim
					</h1>
					<p className='text-sm text-gray-400 mt-1'>
						Xem và quản lý danh sách phim trong hệ thống
					</p>
				</div>
			</div>

			{/* Search & Update */}
			<div className='flex gap-2'>
				<div className='relative flex-1 max-w-md'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						placeholder='Tìm kiếm phim...'
						className='pl-9 bg-white/5 border-white/10 text-sm'
					/>
				</div>
				<Button
					onClick={handleSearch}
					className='bg-primary hover:bg-primary/90 text-black font-medium'
				>
					Tìm kiếm
				</Button>
				<Button
					onClick={handleUpdateFilms}
					disabled={isUpdating}
					className='bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-2'
				>
					<RefreshCw
						className={`h-4 w-4 ${isUpdating ? "animate-spin" : ""}`}
					/>
					{isUpdating ? "Đang cập nhật..." : "Cập nhật phim"}
				</Button>
			</div>

			{/* Films Grid/Table */}
			<div className='rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full'>
						<thead>
							<tr className='border-b border-white/5'>
								<th className='text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Phim
								</th>
								<th className='text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Loại
								</th>
								<th className='text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Đánh giá
								</th>
								<th className='text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Năm
								</th>
								<th className='text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Lượt xem
								</th>
								<th className='text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Ngày upload
								</th>
								<th className='text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Công khai
								</th>
							</tr>
						</thead>
						<tbody>
							{loading ?
								<tr>
									<td
										colSpan={7}
										className='text-center py-12 text-gray-400'
									>
										Đang tải...
									</td>
								</tr>
								: films.length === 0 ?
									<tr>
										<td
											colSpan={7}
											className='text-center py-12 text-gray-400'
										>
											Không tìm thấy phim nào
										</td>
									</tr>
									: films.map((film) => (
										<tr
											key={film._id}
											className='border-b border-white/5 hover:bg-white/[0.02] transition-colors'
										>
											<td className='px-4 py-3'>
												<div className='flex items-center gap-3'>
													{film.poster_url ?
														<Image
															src={film.poster_url}
															alt={film.name}
															width={40}
															height={56}
															unoptimized
															className='h-14 w-10 rounded-md object-cover border border-white/10'
														/>
														: <div className='h-14 w-10 rounded-md bg-white/10 flex items-center justify-center'>
															<Film className='h-4 w-4 text-gray-500' />
														</div>
													}
													<div className='min-w-0'>
														<p
															onClick={() => handleViewFilmDetails(film.slug)}
															className='text-sm font-medium text-white truncate max-w-[200px] cursor-pointer hover:text-primary transition-colors'
														>
															{film.name}
														</p>
														<p className='text-xs text-gray-500 truncate max-w-[200px]'>
															{film.origin_name}
														</p>
													</div>
												</div>
											</td>
											<td className='px-4 py-3'>
												<Badge
													className={`text-xs ${film.type === "single" ?
														"bg-green-500/10 text-green-400 border-green-500/20"
														: "bg-purple-500/10 text-purple-400 border-purple-500/20"
														}`}
												>
													{film.type === "series" ?
														"Phim bộ"
														: film.type === "single" ?
															"Phim lẻ"
															: film.type}
												</Badge>
											</td>
											<td className='px-4 py-3'>
												<div className='flex items-center gap-1'>
													<Star className='h-4 w-4 text-yellow-500 fill-yellow-500' />
													<span className='text-sm font-medium text-white'>
														{film.rating ?
															film.rating.toFixed(1)
															: "0.0"}
													</span>
												</div>
											</td>
											<td className='px-4 py-3 text-sm text-gray-400'>
												{film.year || "—"}
											</td>
											<td className='px-4 py-3'>
												<div className='flex items-center gap-1 text-sm text-gray-400'>
													<Eye className='h-3.5 w-3.5' />
													{film.view?.toLocaleString() ||
														"0"}
												</div>
											</td>
											<td className='px-4 py-3 text-sm text-gray-400'>
												{film.createdAt ?
													new Date(
														film.createdAt,
													).toLocaleDateString("vi-VN", {
														year: "numeric",
														month: "2-digit",
														day: "2-digit",
													})
													: "—"}
											</td>
											<td className='px-4 py-3'>
												<div className='flex items-center justify-center'>
													<Switch
														checked={film.public}
														onCheckedChange={() =>
															handleTogglePublic(
																film._id,
																film.public,
															)
														}
														size='sm'
													/>
												</div>
											</td>
										</tr>
									))
							}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className='flex items-center justify-center gap-2'>
					<Button
						variant='ghost'
						size='icon'
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
						className='text-gray-400 hover:text-white hover:bg-white/10'
					>
						<ChevronLeft className='h-4 w-4' />
					</Button>
					<span className='text-sm text-gray-400'>
						Trang {page} / {totalPages}
					</span>
					<Button
						variant='ghost'
						size='icon'
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
						className='text-gray-400 hover:text-white hover:bg-white/10'
					>
						<ChevronRight className='h-4 w-4' />
					</Button>
				</div>
			)}

			{/* New Films Modal */}
			{showNewFilmsModal && newFilms.length > 0 && (
				<div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
					<div className='bg-[#0a0a0a] border border-white/10 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col'>
						{/* Header */}
						<div className='border-b border-white/10 px-6 py-4 flex items-center justify-between'>
							<div>
								<h2 className='text-xl font-bold text-white flex items-center gap-2'>
									<Film className='h-5 w-5 text-primary' />
									Phim mới đã cập nhật
								</h2>
								<p className='text-sm text-gray-400 mt-1'>
									Đã thêm {newFilms.length} phim mới vào hệ
									thống
								</p>
							</div>
							<Button
								variant='ghost'
								size='icon'
								onClick={() => setShowNewFilmsModal(false)}
								className='text-gray-400 hover:text-white'
							>
								<span className='text-2xl'>×</span>
							</Button>
						</div>

						{/* Content */}
						<div className='overflow-y-auto flex-1'>
							<div className='divide-y divide-white/5'>
								{newFilms.map((film, index) => (
									<div
										key={index}
										className='flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors'
									>
										<div className='flex-shrink-0'>
											{film.poster_url ?
												<Image
													src={film.poster_url}
													alt={film.name}
													width={48}
													height={64}
													unoptimized
													className='h-16 w-12 rounded-md object-cover border border-white/10'
												/>
												: <div className='h-16 w-12 rounded-md bg-white/10 flex items-center justify-center border border-white/10'>
													<Film className='h-6 w-6 text-gray-600' />
												</div>
											}
										</div>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium text-white truncate'>
												{film.name}
											</p>
											<p className='text-xs text-gray-500 mt-1'>
												{film.slug}
											</p>
										</div>
										<div className='flex-shrink-0'>
											<Badge className='text-xs bg-green-500/10 text-green-400 border-green-500/20'>
												Mới
											</Badge>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Footer */}
						<div className='border-t border-white/10 px-6 py-4'>
							<Button
								onClick={() => setShowNewFilmsModal(false)}
								className='w-full bg-primary hover:bg-primary/90 text-black font-medium'
							>
								Đóng
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Film Detail Modal */}
			{showDetailModal && selectedFilm && (
				<div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
					<div className='bg-[#0a0a0a] border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
						{/* Header */}
						<div className='border-b border-white/10 px-6 py-4 flex items-center justify-between'>
							<h2 className='text-xl font-bold text-white'>
								Chi tiết phim
							</h2>
							<Button
								variant='ghost'
								size='icon'
								onClick={() => setShowDetailModal(false)}
								className='text-gray-400 hover:text-white'
							>
								<span className='text-2xl'>×</span>
							</Button>
						</div>

						{/* Content */}
						<div className='overflow-y-auto flex-1'>
							{loadingDetail ?
								<div className='flex items-center justify-center py-12'>
									<div className='text-gray-400'>
										Đang tải thông tin...
									</div>
								</div>
								: <div className='p-6 space-y-6'>
									{/* Film Header with Poster */}
									<div className='flex gap-6'>
										<div className='flex-shrink-0'>
											{selectedFilm.poster_url ?
												<Image
													src={
														selectedFilm.poster_url
													}
													alt={selectedFilm.name}
													width={200}
													height={280}
													unoptimized
													className='h-60 w-40 rounded-lg object-cover border border-white/10'
												/>
												: <div className='h-60 w-40 rounded-lg bg-white/10 flex items-center justify-center border border-white/10'>
													<Film className='h-12 w-12 text-gray-600' />
												</div>
											}
										</div>
										<div className='flex-1'>
											<h3 className='text-3xl font-bold text-white mb-2'>
												{selectedFilm.name}
											</h3>
											{selectedFilm.original_name && (
												<p className='text-gray-400 mb-4'>
													{selectedFilm.original_name}
												</p>
											)}
											<div className='space-y-2 mb-4'>
												<div className='flex items-center gap-2'>
													<span className='text-gray-400 w-24'>
														Loại:
													</span>
													<Badge
														className={`text-xs ${selectedFilm.type ===
															"single" ?
															"bg-green-500/10 text-green-400 border-green-500/20"
															: "bg-purple-500/10 text-purple-400 border-purple-500/20"
															}`}
													>
														{(
															selectedFilm.type ===
															"series"
														) ?
															"Phim bộ"
															: "Phim lẻ"}
													</Badge>
												</div>
												<div className='flex items-center gap-2'>
													<span className='text-gray-400 w-24'>
														Năm:
													</span>
													<span className='text-white'>
														{selectedFilm.year ||
															"—"}
													</span>
												</div>
												<div className='flex items-center gap-2'>
													<span className='text-gray-400 w-24'>
														Đánh giá:
													</span>
													<div className='flex items-center gap-1'>
														<Star className='h-4 w-4 text-yellow-500 fill-yellow-500' />
														<span className='text-white'>
															{selectedFilm.rating.toFixed(
																1,
															)}
														</span>
													</div>
												</div>
												<div className='flex items-center gap-2'>
													<span className='text-gray-400 w-24'>
														Lượt xem:
													</span>
													<span className='text-white'>
														{selectedFilm.views.toLocaleString()}
													</span>
												</div>
											</div>
										</div>
									</div>

									{/* Description */}
									{selectedFilm.description && (
										<div>
											<h4 className='text-lg font-bold text-white mb-2'>
												Mô tả
											</h4>
											<p className='text-gray-300 leading-relaxed'>
												{selectedFilm.description}
											</p>
										</div>
									)}

									{/* Details Grid */}
									<div className='grid grid-cols-2 gap-4'>
										{(
											selectedFilm.genres &&
											selectedFilm.genres.length > 0
										) ?
											<div>
												<h4 className='text-sm font-bold text-gray-400 uppercase mb-2'>
													Thể loại
												</h4>
												<p className='text-white'>
													{selectedFilm.genres.join(
														", ",
													)}
												</p>
											</div>
											: null}
										{(
											selectedFilm.countries &&
											selectedFilm.countries.length > 0
										) ?
											<div>
												<h4 className='text-sm font-bold text-gray-400 uppercase mb-2'>
													Quốc gia
												</h4>
												<p className='text-white'>
													{selectedFilm.countries.join(
														", ",
													)}
												</p>
											</div>
											: null}
										{selectedFilm.director ?
											<div>
												<h4 className='text-sm font-bold text-gray-400 uppercase mb-2'>
													Đạo diễn
												</h4>
												<p className='text-white'>
													{selectedFilm.director}
												</p>
											</div>
											: null}
										{selectedFilm.quality ?
											<div>
												<h4 className='text-sm font-bold text-gray-400 uppercase mb-2'>
													Chất lượng
												</h4>
												<p className='text-white'>
													{selectedFilm.quality}
												</p>
											</div>
											: null}
										{selectedFilm.language ?
											<div>
												<h4 className='text-sm font-bold text-gray-400 uppercase mb-2'>
													Ngôn ngữ
												</h4>
												<p className='text-white'>
													{selectedFilm.language}
												</p>
											</div>
											: null}
										{selectedFilm.time ?
											<div>
												<h4 className='text-sm font-bold text-gray-400 uppercase mb-2'>
													Thời lượng
												</h4>
												<p className='text-white'>
													{selectedFilm.time}
												</p>
											</div>
											: null}
										{selectedFilm.total_episodes > 0 ?
											<div>
												<h4 className='text-sm font-bold text-gray-400 uppercase mb-2'>
													Số tập
												</h4>
												<p className='text-white'>
													{
														selectedFilm.total_episodes
													}
												</p>
											</div>
											: null}
										{selectedFilm.type === "series" ?
											<div>
												<h4 className='text-sm font-bold text-gray-400 uppercase mb-2'>
													Tập hiện tại
												</h4>
												<p className='text-white'>
													{selectedFilm.episode_current || "Đang cập nhật"}
												</p>
											</div>
											: null}
									</div>

									{/* Casts */}
									{selectedFilm.casts && (
										<div>
											<h4 className='text-sm font-bold text-gray-400 uppercase mb-2'>
												Diễn viên
											</h4>
											<p className='text-white line-clamp-3'>
												{selectedFilm.casts}
											</p>
										</div>
									)}
								</div>
							}
						</div>


					</div>
				</div>
			)}
		</div>
	);
}
