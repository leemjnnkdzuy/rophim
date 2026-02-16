"use client";

import React, {useEffect, useState, useCallback} from "react";
import Image from "next/image";
import {
	MessageSquare,
	Search,
	ChevronLeft,
	ChevronRight,
	Trash2,
	User,
	Film,
	Clock,
} from "lucide-react";
import {Input} from "@/app/components/ui/input";
import {Button} from "@/app/components/ui/button";
import {Badge} from "@/app/components/ui/badge";
import api from "@/app/utils/axios";

interface Comment {
	_id: string;
	content: string;
	user: {
		_id: string;
		username: string;
		avatar?: string;
	};
	filmSlug: string;
	createdAt: string;
}

export default function CommentsDashboards() {
	const [comments, setComments] = useState<Comment[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	const fetchComments = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.get("/admin/comments", {
				params: {page, limit: 20, search: searchQuery},
			});
			setComments(res.data.comments || []);
			setTotalPages(res.data.totalPages || 1);
		} catch (error) {
			console.error("Failed to fetch comments:", error);
		} finally {
			setLoading(false);
		}
	}, [page, searchQuery]);

	useEffect(() => {
		fetchComments();
	}, [fetchComments]);

	const handleSearch = () => {
		setPage(1);
		fetchComments();
	};

	const handleDelete = async (commentId: string) => {
		if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
		try {
			await api.delete(`/admin/comments/${commentId}`);
			fetchComments();
		} catch (error) {
			console.error("Failed to delete comment:", error);
		}
	};

	const formatTimeAgo = (dateStr: string) => {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diff < 60) return `${diff} giây trước`;
		if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
		if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
		if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
		return date.toLocaleDateString("vi-VN");
	};

	return (
		<div className='space-y-6'>
			{/* Page Header */}
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-bold text-white flex items-center gap-2'>
						Quản lý bình luận
					</h1>
					<p className='text-sm text-gray-400 mt-1'>
						Xem và quản lý bình luận của người dùng
					</p>
				</div>
			</div>

			{/* Search */}
			<div className='flex gap-2'>
				<div className='relative flex-1 max-w-md'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						placeholder='Tìm kiếm bình luận...'
						className='pl-9 bg-white/5 border-white/10 text-sm'
					/>
				</div>
				<Button
					onClick={handleSearch}
					className='bg-primary hover:bg-primary/90 text-black font-medium'
				>
					Tìm kiếm
				</Button>
			</div>

			{/* Comments List */}
			<div className='space-y-3'>
				{loading ?
					<div className='text-center py-12 text-gray-400 rounded-xl border border-white/5 bg-white/[0.02]'>
						Đang tải...
					</div>
				: comments.length === 0 ?
					<div className='text-center py-12 text-gray-400 rounded-xl border border-white/5 bg-white/[0.02]'>
						Không tìm thấy bình luận nào
					</div>
				:	comments.map((comment) => (
						<div
							key={comment._id}
							className='rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-colors'
						>
							<div className='flex items-start justify-between gap-4'>
								<div className='flex items-start gap-3 flex-1 min-w-0'>
									{comment.user?.avatar ?
										<Image
											src={comment.user.avatar}
											alt={comment.user.username}
											width={36}
											height={36}
											unoptimized
											className='h-9 w-9 rounded-full object-cover border border-white/10 shrink-0'
										/>
									:	<span className='flex h-9 w-9 items-center justify-center rounded-full bg-white/10 shrink-0'>
											<User className='h-4 w-4 text-gray-400' />
										</span>
									}
									<div className='min-w-0 flex-1'>
										<div className='flex items-center gap-2 mb-1'>
											<span className='text-sm font-medium text-white'>
												{comment.user?.username ||
													"Ẩn danh"}
											</span>
											<Badge className='text-[10px] bg-white/5 text-gray-400 border-white/10'>
												<Film className='h-2.5 w-2.5 mr-1' />
												{comment.filmSlug}
											</Badge>
										</div>
										<p className='text-sm text-gray-300 break-words'>
											{comment.content}
										</p>
										<div className='flex items-center gap-1 mt-2 text-xs text-gray-500'>
											<Clock className='h-3 w-3' />
											{formatTimeAgo(comment.createdAt)}
										</div>
									</div>
								</div>
								<Button
									variant='ghost'
									size='icon'
									onClick={() => handleDelete(comment._id)}
									className='text-gray-500 hover:text-red-400 hover:bg-red-500/10 shrink-0'
								>
									<Trash2 className='h-4 w-4' />
								</Button>
							</div>
						</div>
					))
				}
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
		</div>
	);
}
