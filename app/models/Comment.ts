import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IComment extends Document {
	filmSlug: string;
	userId: Types.ObjectId;
	username: string;
	content: string;
	parentId: Types.ObjectId | null;
	likes: string[]; // array of userIds
	isPinned: boolean;
	pinnedBy: Types.ObjectId | null;
	isDeleted: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
	{
		filmSlug: {
			type: String,
			required: true,
			index: true,
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		username: {
			type: String,
			required: true,
		},
		content: {
			type: String,
			required: [true, "Nội dung bình luận không được để trống"],
			maxlength: [1000, "Bình luận không được quá 1000 ký tự"],
			trim: true,
		},
		parentId: {
			type: Schema.Types.ObjectId,
			ref: "Comment",
			default: null,
		},
		likes: {
			type: [String],
			default: [],
		},
		isPinned: {
			type: Boolean,
			default: false,
		},
		pinnedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	},
);

// Compound index for efficient queries
commentSchema.index({ filmSlug: 1, createdAt: -1 });
commentSchema.index({ filmSlug: 1, isPinned: -1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: 1 });

if (mongoose.models.Comment) {
	delete mongoose.models.Comment;
}

const Comment: Model<IComment> = mongoose.model<IComment>(
	"Comment",
	commentSchema,
);

export default Comment;
