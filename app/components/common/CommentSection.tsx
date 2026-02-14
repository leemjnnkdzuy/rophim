"use client";

import React, {useState, useEffect, useCallback, useRef} from "react";
import Image from "next/image";
import {
	MessageCircle,
	Heart,
	Reply,
	Trash2,
	Pin,
	ChevronDown,
	Loader2,
	Send,
	AlertCircle,
	User as UserIcon,
	Smile,
} from "lucide-react";
import {Button} from "@/app/components/ui/button";
import {Badge} from "@/app/components/ui/badge";
import ConfirmDeletePopup from "@/app/components/common/ComfirmDeletePopup";
import api from "@/app/utils/axios";
import {useAuth} from "@/app/hooks/useAuth";
import {useGlobalNotificationPopup} from "@/app/hooks/useGlobalNotificationPopup";

// ─── Types ─────────────────────────────────────────────────
interface CommentData {
	_id: string;
	filmSlug: string;
	userId: string;
	username: string;
	userAvatar?: string;
	content: string;
	parentId: string | null;
	likes: string[];
	isPinned: boolean;
	isDeleted: boolean;
	replyCount?: number;
	createdAt: string;
	updatedAt: string;
}

// ─── Utils ─────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHours = Math.floor(diffMin / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSec < 60) return "Vừa xong";
	if (diffMin < 60) return `${diffMin} phút trước`;
	if (diffHours < 24) return `${diffHours} giờ trước`;
	if (diffDays < 7) return `${diffDays} ngày trước`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
	return date.toLocaleDateString("vi-VN");
}

// ─── Comment Input ─────────────────────────────────────────
function CommentInput({
	filmSlug,
	parentId,
	placeholder,
	onCommentAdded,
	onCancel,
	autoFocus,
}: {
	filmSlug: string;
	parentId?: string | null;
	placeholder?: string;
	onCommentAdded: (comment: CommentData) => void;
	onCancel?: () => void;
	autoFocus?: boolean;
}) {
	const {isAuthenticated, user} = useAuth();
	const {showNotification} = useGlobalNotificationPopup();
	const [content, setContent] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const emojiPickerRef = useRef<HTMLDivElement>(null);

	const EMOJI_LIST = [
		"😀",
		"😂",
		"🤣",
		"😍",
		"🥰",
		"😎",
		"🤩",
		"😢",
		"😭",
		"😡",
		"🤔",
		"😱",
		"🥺",
		"😏",
		"🙄",
		"😴",
		"👍",
		"👎",
		"👏",
		"🔥",
		"❤️",
		"💔",
		"💯",
		"⭐",
		"🎬",
		"🍿",
		"📺",
		"🎭",
		"🎉",
		"😈",
		"💀",
		"👀",
	];

	useEffect(() => {
		if (autoFocus && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [autoFocus]);

	// Close emoji picker on outside click
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				emojiPickerRef.current &&
				!emojiPickerRef.current.contains(e.target as Node)
			) {
				setShowEmojiPicker(false);
			}
		};
		if (showEmojiPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, [showEmojiPicker]);

	const insertEmoji = (emoji: string) => {
		const ta = textareaRef.current;
		if (!ta) return;
		const start = ta.selectionStart;
		const end = ta.selectionEnd;
		const newContent = content.slice(0, start) + emoji + content.slice(end);
		if (newContent.length > 1000) return;
		setContent(newContent);
		setShowEmojiPicker(false);
		setTimeout(() => {
			ta.focus();
			const pos = start + emoji.length;
			ta.setSelectionRange(pos, pos);
			adjustHeight();
		}, 0);
	};

	const adjustHeight = () => {
		const ta = textareaRef.current;
		if (ta) {
			ta.style.height = "auto";
			ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
		}
	};

	const handleSubmit = async () => {
		if (!content.trim() || isSubmitting) return;
		if (!isAuthenticated) {
			showNotification("Vui lòng đăng nhập để bình luận", "warning");
			return;
		}

		try {
			setIsSubmitting(true);
			const response = await api.post("/comments", {
				filmSlug,
				content: content.trim(),
				parentId: parentId || null,
			});
			if (response.data?.success) {
				onCommentAdded(response.data.comment);
				setContent("");
				if (textareaRef.current) {
					textareaRef.current.style.height = "auto";
				}
			}
		} catch {
			showNotification("Không thể gửi bình luận", "error");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
		if (e.key === "Escape" && onCancel) {
			onCancel();
		}
	};

	if (!isAuthenticated) {
		return (
			<div className='flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5'>
				<div className='w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0'>
					<UserIcon className='h-4 w-4 text-gray-500' />
				</div>
				<p className='text-sm text-gray-500'>Đăng nhập để bình luận</p>
			</div>
		);
	}

	return (
		<div className='flex gap-3'>
			{/* Avatar */}
			<div className='flex-shrink-0'>
				{user?.avatar ?
					<Image
						src={user.avatar}
						alt={user.username}
						width={parentId ? 32 : 36}
						height={parentId ? 32 : 36}
						className='rounded-full object-cover'
						unoptimized
					/>
				:	<div
						className={`${parentId ? "w-8 h-8" : "w-9 h-9"} rounded-full bg-primary/20 flex items-center justify-center`}
					>
						<span className='text-xs font-bold text-primary uppercase'>
							{user?.username?.charAt(0) || "?"}
						</span>
					</div>
				}
			</div>

			{/* Input area */}
			<div className='flex-1 space-y-2'>
				<div className='relative'>
					<textarea
						ref={textareaRef}
						value={content}
						onChange={(e) => {
							setContent(e.target.value);
							adjustHeight();
						}}
						onKeyDown={handleKeyDown}
						placeholder={placeholder || "Viết bình luận..."}
						rows={1}
						maxLength={1000}
						className='w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 pr-10 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all'
					/>
					{/* Emoji button */}
					<div
						ref={emojiPickerRef}
						className='absolute right-2 top-2'
					>
						<button
							type='button'
							onClick={() => setShowEmojiPicker(!showEmojiPicker)}
							className={`p-1 rounded-md transition-colors cursor-pointer ${
								showEmojiPicker ?
									"text-primary bg-primary/10"
								:	"text-gray-500 hover:text-primary hover:bg-white/5"
							}`}
						>
							<Smile className='h-4 w-4' />
						</button>
						{showEmojiPicker && (
							<div className='absolute right-0 top-8 z-50 bg-neutral-900 border border-white/10 rounded-xl p-3 shadow-xl shadow-black/40 w-[280px]'>
								<div className='grid grid-cols-8 gap-1'>
									{EMOJI_LIST.map((emoji) => (
										<button
											key={emoji}
											type='button'
											onClick={() => insertEmoji(emoji)}
											className='w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors cursor-pointer text-base'
										>
											{emoji}
										</button>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
				<div className='flex items-center justify-between'>
					<span className='text-[10px] text-gray-600'>
						{content.length}/1000
					</span>
					<div className='flex items-center gap-2'>
						{onCancel && (
							<Button
								variant='ghost'
								size='sm'
								onClick={onCancel}
								className='text-gray-400 hover:text-white h-8 px-3 text-xs cursor-pointer'
							>
								Hủy
							</Button>
						)}
						<Button
							size='sm'
							onClick={handleSubmit}
							disabled={!content.trim() || isSubmitting}
							className='bg-primary hover:bg-primary/90 text-black h-8 px-4 rounded-full text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all'
						>
							{isSubmitting ?
								<Loader2 className='h-3.5 w-3.5 animate-spin' />
							:	<>
									<Send className='h-3.5 w-3.5 mr-1' />
									Gửi
								</>
							}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Single Comment ────────────────────────────────────────
function CommentItem({
	comment,
	currentUserId,
	isAdmin,
	filmSlug,
	onDeleted,
	onReplyAdded,
}: {
	comment: CommentData;
	currentUserId: string | null;
	isAdmin: boolean;
	filmSlug: string;
	onDeleted: (commentId: string) => void;
	onReplyAdded: (parentId: string, reply: CommentData) => void;
}) {
	const {showNotification} = useGlobalNotificationPopup();
	const [likes, setLikes] = useState<string[]>(comment.likes || []);
	const [isPinned, setIsPinned] = useState(comment.isPinned);
	const [showReplyInput, setShowReplyInput] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [replies, setReplies] = useState<CommentData[]>([]);
	const [showReplies, setShowReplies] = useState(false);
	const [loadingReplies, setLoadingReplies] = useState(false);
	const [replyCount, setReplyCount] = useState(comment.replyCount || 0);

	const isOwner = currentUserId === comment.userId;
	const canDelete = isOwner || isAdmin;
	const isLiked = currentUserId ? likes.includes(currentUserId) : false;

	const handleLike = async () => {
		if (!currentUserId) {
			showNotification("Vui lòng đăng nhập", "warning");
			return;
		}
		try {
			const response = await api.patch("/comments", {
				commentId: comment._id,
				action: "like",
			});
			if (response.data?.success) {
				setLikes(response.data.likes);
			}
		} catch {
			showNotification("Không thể thực hiện", "error");
		}
	};

	const handlePin = async () => {
		try {
			const response = await api.patch("/comments", {
				commentId: comment._id,
				action: "pin",
			});
			if (response.data?.success) {
				setIsPinned(response.data.isPinned);
				showNotification(
					response.data.isPinned ?
						"Đã ghim bình luận"
					:	"Đã bỏ ghim bình luận",
					"success",
				);
			}
		} catch {
			showNotification("Không thể ghim bình luận", "error");
		}
	};

	const handleDeleteClick = () => {
		setShowDeleteConfirm(true);
	};

	const handleConfirmDelete = async () => {
		try {
			const response = await api.delete(
				`/comments?commentId=${comment._id}`,
			);
			if (response.data?.success) {
				onDeleted(comment._id);
				showNotification("Đã xóa bình luận", "success");
			}
		} catch {
			showNotification("Không thể xóa bình luận", "error");
			throw new Error("Failed to delete");
		}
	};

	const loadReplies = async () => {
		if (loadingReplies) return;
		try {
			setLoadingReplies(true);
			const response = await api.get(
				`/comments?filmSlug=${filmSlug}&parentId=${comment._id}`,
			);
			if (response.data?.success) {
				setReplies(response.data.comments);
				setShowReplies(true);
			}
		} catch {
			showNotification("Không thể tải phản hồi", "error");
		} finally {
			setLoadingReplies(false);
		}
	};

	const toggleReplies = () => {
		if (showReplies) {
			setShowReplies(false);
		} else {
			loadReplies();
		}
	};

	const handleReplyAdded = (reply: CommentData) => {
		setReplies((prev) => [...prev, reply]);
		setReplyCount((prev) => prev + 1);
		setShowReplies(true);
		setShowReplyInput(false);
		onReplyAdded(comment._id, reply);
	};

	return (
		<div className='group'>
			<div className='flex gap-3'>
				{/* Avatar */}
				<div className='flex-shrink-0 mt-0.5'>
					{comment.userAvatar ?
						<Image
							src={comment.userAvatar}
							alt={comment.username}
							width={36}
							height={36}
							className='rounded-full object-cover'
							unoptimized
						/>
					:	<div className='w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center'>
							<span className='text-xs font-bold text-primary uppercase'>
								{comment.username?.charAt(0) || "?"}
							</span>
						</div>
					}
				</div>

				{/* Content */}
				<div className='flex-1 min-w-0'>
					<div className='bg-white/[0.04] rounded-xl px-4 py-3 border border-white/5'>
						<div className='flex items-center gap-2 mb-1'>
							<span className='text-sm font-semibold text-white'>
								{comment.username}
							</span>
							{isPinned && (
								<Badge className='bg-amber-500/15 text-amber-400 border-amber-500/30 text-[9px] font-bold px-1.5 py-0 rounded'>
									<Pin className='h-2.5 w-2.5 mr-0.5' />
									Đã ghim
								</Badge>
							)}
							<span className='text-[11px] text-gray-500'>
								{timeAgo(comment.createdAt)}
							</span>
						</div>
						<p className='text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words'>
							{comment.content}
						</p>
					</div>

					{/* Actions */}
					<div className='flex items-center gap-1 mt-1.5 ml-1'>
						<button
							onClick={handleLike}
							className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
								isLiked ?
									"text-red-400 hover:bg-red-500/10"
								:	"text-gray-500 hover:text-red-400 hover:bg-white/5"
							}`}
						>
							<Heart
								className='h-3.5 w-3.5'
								fill={isLiked ? "currentColor" : "none"}
							/>
							{likes.length > 0 && <span>{likes.length}</span>}
						</button>

						{!comment.parentId && (
							<button
								onClick={() =>
									setShowReplyInput(!showReplyInput)
								}
								className='flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:text-primary hover:bg-white/5 transition-all cursor-pointer'
							>
								<Reply className='h-3.5 w-3.5' />
								Trả lời
							</button>
						)}

						{isAdmin && !comment.parentId && (
							<button
								onClick={handlePin}
								className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
									isPinned ?
										"text-amber-400 hover:bg-amber-500/10"
									:	"text-gray-500 hover:text-amber-400 hover:bg-white/5"
								}`}
							>
								<Pin className='h-3.5 w-3.5' />
								{isPinned ? "Bỏ ghim" : "Ghim"}
							</button>
						)}

						{canDelete && (
							<>
								<button
									onClick={handleDeleteClick}
									className='flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100'
								>
									<Trash2 className='h-3.5 w-3.5' />
									Xóa
								</button>

								{/* Delete Confirmation */}
								<ConfirmDeletePopup
									isOpen={showDeleteConfirm}
									title='Xóa bình luận?'
									message='Bạn chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.'
									description={
										!comment.parentId ?
											"Các phản hồi của bình luận này cũng sẽ bị xóa."
										:	""
									}
									onConfirm={handleConfirmDelete}
									onCancel={() => setShowDeleteConfirm(false)}
								/>
							</>
						)}
					</div>

					{/* Reply count toggle */}
					{replyCount > 0 && !comment.parentId && (
						<button
							onClick={toggleReplies}
							className='flex items-center gap-1.5 ml-1 mt-1 text-xs text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors'
						>
							{loadingReplies ?
								<Loader2 className='h-3 w-3 animate-spin' />
							:	<ChevronDown
									className={`h-3 w-3 transition-transform ${showReplies ? "rotate-180" : ""}`}
								/>
							}
							{showReplies ?
								"Ẩn phản hồi"
							:	`Xem ${replyCount} phản hồi`}
						</button>
					)}

					{/* Reply input */}
					{showReplyInput && (
						<div className='mt-3 ml-1'>
							<CommentInput
								filmSlug={filmSlug}
								parentId={comment._id}
								placeholder={`Trả lời @${comment.username}...`}
								onCommentAdded={handleReplyAdded}
								onCancel={() => setShowReplyInput(false)}
								autoFocus
							/>
						</div>
					)}

					{/* Replies list */}
					{showReplies && replies.length > 0 && (
						<div className='mt-3 ml-1 space-y-3 pl-3 border-l-2 border-white/5'>
							{replies.map((reply) => (
								<CommentItem
									key={reply._id}
									comment={reply}
									currentUserId={currentUserId}
									isAdmin={isAdmin}
									filmSlug={filmSlug}
									onDeleted={(replyId) => {
										setReplies((prev) =>
											prev.filter(
												(r) => r._id !== replyId,
											),
										);
										setReplyCount((prev) =>
											Math.max(0, prev - 1),
										);
									}}
									onReplyAdded={onReplyAdded}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// ─── Main CommentSection ───────────────────────────────────
export default function CommentSection({filmSlug}: {filmSlug: string}) {
	const {user} = useAuth();
	const [comments, setComments] = useState<CommentData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [total, setTotal] = useState(0);
	const [loadingMore, setLoadingMore] = useState(false);

	const currentUserId = user?.id || null;
	const isAdmin = user?.role === "admin";

	const fetchComments = useCallback(
		async (pageNum: number, append = false) => {
			try {
				if (pageNum === 1) setLoading(true);
				else setLoadingMore(true);

				const response = await api.get(
					`/comments?filmSlug=${filmSlug}&page=${pageNum}&limit=15`,
				);

				if (response.data?.success) {
					const newComments = response.data.comments;
					setComments((prev) =>
						append ? [...prev, ...newComments] : newComments,
					);
					setTotal(response.data.total);
					setHasMore(response.data.hasMore);
					setPage(pageNum);
					setError(false);
				}
			} catch {
				setError(true);
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[filmSlug],
	);

	useEffect(() => {
		if (filmSlug) {
			fetchComments(1);
		}
	}, [filmSlug, fetchComments]);

	const handleNewComment = (comment: CommentData) => {
		setComments((prev) => [comment, ...prev]);
		setTotal((prev) => prev + 1);
	};

	const handleCommentDeleted = (commentId: string) => {
		setComments((prev) => prev.filter((c) => c._id !== commentId));
		setTotal((prev) => Math.max(0, prev - 1));
	};

	const handleReplyAdded = () => {
		// Reply counts are handled by individual CommentItem
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center gap-2'>
				<MessageCircle className='h-5 w-5 text-primary' />
				<h3 className='text-lg font-bold text-white'>Bình luận</h3>
				{total > 0 && (
					<Badge
						variant='outline'
						className='border-white/10 text-gray-400 text-xs px-2 py-0.5 rounded-full'
					>
						{total}
					</Badge>
				)}
			</div>

			{/* Comment Input */}
			<CommentInput
				filmSlug={filmSlug}
				onCommentAdded={handleNewComment}
			/>

			{/* Comments List */}
			{loading ?
				<div className='flex items-center justify-center py-12'>
					<Loader2 className='h-8 w-8 text-primary animate-spin' />
				</div>
			: error ?
				<div className='flex flex-col items-center justify-center py-12 gap-3'>
					<AlertCircle className='h-8 w-8 text-red-400' />
					<p className='text-sm text-gray-400'>
						Không thể tải bình luận
					</p>
					<Button
						variant='outline'
						size='sm'
						onClick={() => fetchComments(1)}
						className='border-white/10 text-gray-300 hover:bg-white/10 cursor-pointer text-xs'
					>
						Thử lại
					</Button>
				</div>
			: comments.length === 0 ?
				<div className='flex flex-col items-center justify-center py-12 gap-2'>
					<MessageCircle className='h-10 w-10 text-white/10' />
					<p className='text-sm text-gray-500'>
						Chưa có bình luận nào. Hãy là người đầu tiên!
					</p>
				</div>
			:	<div className='space-y-4'>
					{comments.map((comment) => (
						<CommentItem
							key={comment._id}
							comment={comment}
							currentUserId={currentUserId}
							isAdmin={isAdmin}
							filmSlug={filmSlug}
							onDeleted={handleCommentDeleted}
							onReplyAdded={handleReplyAdded}
						/>
					))}

					{/* Load More */}
					{hasMore && (
						<div className='flex justify-center pt-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => fetchComments(page + 1, true)}
								disabled={loadingMore}
								className='border-white/10 text-gray-300 hover:bg-white/10 rounded-full px-6 cursor-pointer transition-all text-xs'
							>
								{loadingMore ?
									<Loader2 className='h-4 w-4 animate-spin mr-1.5' />
								:	<ChevronDown className='h-4 w-4 mr-1.5' />}
								Xem thêm bình luận
							</Button>
						</div>
					)}
				</div>
			}
		</div>
	);
}
