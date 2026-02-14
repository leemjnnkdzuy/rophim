import {NextRequest, NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import User from "@/app/models/User";
import Comment from "@/app/models/Comment";
import {verifyAccessToken} from "@/app/utils/jwt";

function getUserId(request: NextRequest): string | null {
	const accessToken = request.cookies.get("access_token")?.value;
	if (!accessToken) return null;
	const payload = verifyAccessToken(accessToken);
	return payload?.userId || null;
}

// GET: Fetch comments for a film
export async function GET(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const filmSlug = url.searchParams.get("filmSlug");
		const parentId = url.searchParams.get("parentId");
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "20");

		if (!filmSlug) {
			return NextResponse.json(
				{success: false, message: "Thiếu filmSlug"},
				{status: 400},
			);
		}

		await connectDatabase();

		const skip = (page - 1) * limit;

		if (parentId) {
			// Fetch replies for a specific comment
			const replies = await Comment.find({
				parentId,
				isDeleted: false,
			})
				.sort({createdAt: 1})
				.skip(skip)
				.limit(limit)
				.lean();

			const totalReplies = await Comment.countDocuments({
				parentId,
				isDeleted: false,
			});

			return NextResponse.json({
				success: true,
				comments: replies,
				total: totalReplies,
				page,
				hasMore: skip + replies.length < totalReplies,
			});
		}

		// Fetch top-level comments (pinned first, then by date)
		const comments = await Comment.find({
			filmSlug,
			parentId: null,
			isDeleted: false,
		})
			.sort({isPinned: -1, createdAt: -1})
			.skip(skip)
			.limit(limit)
			.lean();

		const totalComments = await Comment.countDocuments({
			filmSlug,
			parentId: null,
			isDeleted: false,
		});

		// Get reply counts for each comment
		const commentIds = comments.map((c) => c._id);
		const replyCounts = await Comment.aggregate([
			{
				$match: {
					parentId: {$in: commentIds},
					isDeleted: false,
				},
			},
			{
				$group: {
					_id: "$parentId",
					count: {$sum: 1},
				},
			},
		]);

		const replyCountMap = new Map(
			replyCounts.map((r) => [r._id.toString(), r.count]),
		);

		const enrichedComments = comments.map((c) => ({
			...c,
			replyCount: replyCountMap.get(c._id.toString()) || 0,
		}));

		return NextResponse.json({
			success: true,
			comments: enrichedComments,
			total: totalComments,
			page,
			hasMore: skip + comments.length < totalComments,
		});
	} catch (error) {
		console.error("Get comments error:", error);
		return NextResponse.json(
			{success: false, message: "Lỗi server"},
			{status: 500},
		);
	}
}

// POST: Create a comment or reply
export async function POST(request: NextRequest) {
	try {
		const userId = getUserId(request);
		if (!userId) {
			return NextResponse.json(
				{success: false, message: "Chưa đăng nhập"},
				{status: 401},
			);
		}

		const body = await request.json();
		const {filmSlug, content, parentId} = body;

		if (!filmSlug || !content?.trim()) {
			return NextResponse.json(
				{success: false, message: "Thiếu thông tin bình luận"},
				{status: 400},
			);
		}

		if (content.trim().length > 1000) {
			return NextResponse.json(
				{
					success: false,
					message: "Bình luận không được quá 1000 ký tự",
				},
				{status: 400},
			);
		}

		await connectDatabase();

		const user = await User.findById(userId).select("username avatar");
		if (!user) {
			return NextResponse.json(
				{success: false, message: "Không tìm thấy người dùng"},
				{status: 404},
			);
		}

		// If it's a reply, verify parent exists
		if (parentId) {
			const parentComment = await Comment.findById(parentId);
			if (!parentComment || parentComment.isDeleted) {
				return NextResponse.json(
					{success: false, message: "Bình luận gốc không tồn tại"},
					{status: 404},
				);
			}
			// Don't allow nested replies (only 1 level deep)
			if (parentComment.parentId) {
				return NextResponse.json(
					{
						success: false,
						message: "Không thể trả lời bình luận cấp 2",
					},
					{status: 400},
				);
			}
		}

		const userAvatar =
			user.avatar?.data ?
				`data:${user.avatar.mime};base64,${user.avatar.data}`
			:	"";

		const comment = await Comment.create({
			filmSlug: filmSlug.trim(),
			userId,
			username: user.username,
			userAvatar,
			content: content.trim(),
			parentId: parentId || null,
		});

		return NextResponse.json({
			success: true,
			comment: {
				...comment.toObject(),
				replyCount: 0,
			},
		});
	} catch (error) {
		console.error("Create comment error:", error);
		return NextResponse.json(
			{success: false, message: "Lỗi server"},
			{status: 500},
		);
	}
}

// PATCH: Like, pin, or update a comment
export async function PATCH(request: NextRequest) {
	try {
		const userId = getUserId(request);
		if (!userId) {
			return NextResponse.json(
				{success: false, message: "Chưa đăng nhập"},
				{status: 401},
			);
		}

		const body = await request.json();
		const {commentId, action} = body;

		if (!commentId || !action) {
			return NextResponse.json(
				{success: false, message: "Thiếu thông tin"},
				{status: 400},
			);
		}

		await connectDatabase();

		const comment = await Comment.findById(commentId);
		if (!comment || comment.isDeleted) {
			return NextResponse.json(
				{success: false, message: "Bình luận không tồn tại"},
				{status: 404},
			);
		}

		// LIKE / UNLIKE
		if (action === "like") {
			const alreadyLiked = (comment.likes || []).includes(userId);
			const update =
				alreadyLiked ?
					{$pull: {likes: userId}}
				:	{$addToSet: {likes: userId}};

			const updated = await Comment.findByIdAndUpdate(commentId, update, {
				new: true,
			}).lean();

			return NextResponse.json({
				success: true,
				likes: updated?.likes || [],
				isLiked: !alreadyLiked,
			});
		}

		// PIN / UNPIN (admin only)
		if (action === "pin") {
			const user = await User.findById(userId).select("role");
			if (!user || user.role !== "admin") {
				return NextResponse.json(
					{
						success: false,
						message: "Chỉ admin mới có thể ghim bình luận",
					},
					{status: 403},
				);
			}

			// Only top-level comments can be pinned
			if (comment.parentId) {
				return NextResponse.json(
					{
						success: false,
						message: "Không thể ghim bình luận trả lời",
					},
					{status: 400},
				);
			}

			const newPinned = !comment.isPinned;
			await Comment.findByIdAndUpdate(commentId, {
				isPinned: newPinned,
				pinnedBy: newPinned ? user._id : null,
			});

			return NextResponse.json({
				success: true,
				isPinned: newPinned,
			});
		}

		return NextResponse.json(
			{success: false, message: "Hành động không hợp lệ"},
			{status: 400},
		);
	} catch (error) {
		console.error("Update comment error:", error);
		return NextResponse.json(
			{success: false, message: "Lỗi server"},
			{status: 500},
		);
	}
}

// DELETE: Soft delete a comment
export async function DELETE(request: NextRequest) {
	try {
		const userId = getUserId(request);
		if (!userId) {
			return NextResponse.json(
				{success: false, message: "Chưa đăng nhập"},
				{status: 401},
			);
		}

		const url = new URL(request.url);
		const commentId = url.searchParams.get("commentId");

		if (!commentId) {
			return NextResponse.json(
				{success: false, message: "Thiếu commentId"},
				{status: 400},
			);
		}

		await connectDatabase();

		const comment = await Comment.findById(commentId);
		if (!comment || comment.isDeleted) {
			return NextResponse.json(
				{success: false, message: "Bình luận không tồn tại"},
				{status: 404},
			);
		}

		// Only comment owner or admin can delete
		const user = await User.findById(userId).select("role");
		const isOwner = comment.userId.toString() === userId;
		const isAdmin = user?.role === "admin";

		if (!isOwner && !isAdmin) {
			return NextResponse.json(
				{
					success: false,
					message: "Bạn không có quyền xóa bình luận này",
				},
				{status: 403},
			);
		}

		// If it's a top-level comment, hard delete all replies FIRST
		if (!comment.parentId) {
			// Check how many replies exist
			const replyCount = await Comment.countDocuments({
				parentId: comment._id,
			});
			console.log(
				`Found ${replyCount} replies for comment ${comment._id}`,
			);

			if (replyCount > 0) {
				const deleteResult = await Comment.deleteMany({
					parentId: comment._id,
				});
				console.log(
					`Successfully deleted ${deleteResult.deletedCount} replies`,
				);
			}
		}

		// Then soft delete the comment itself
		await Comment.findByIdAndUpdate(commentId, {
			isDeleted: true,
			content: "Bình luận đã bị xóa",
		});

		return NextResponse.json({
			success: true,
			message: "Đã xóa bình luận",
		});
	} catch (error) {
		console.error("Delete comment error:", error);
		return NextResponse.json(
			{success: false, message: "Lỗi server"},
			{status: 500},
		);
	}
}
