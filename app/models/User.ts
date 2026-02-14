import mongoose, {Document, Model, Schema} from "mongoose";
import bcrypt from "bcryptjs";

export interface IWatchHistoryItem {
	filmSlug: string;
	episodeSlug: string;
	episodeName: string;
	serverIdx: number;
	watchedAt: Date;
}

export interface IUser extends Document {
	username: string;
	email: string;
	password: string;
	avatar?: {
		mime: string;
		data: string;
	};
	role: "user" | "admin";
	savedFilms: string[];
	watchHistory: IWatchHistoryItem[];
	ratings?: Array<{
		filmSlug: string;
		score: number;
		ratedAt: Date;
	}>;
	isVerified: boolean;
	createdAt: Date;
	updatedAt: Date;
	comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
	{
		username: {
			type: String,
			required: [true, "Username is required"],
			unique: true,
			trim: true,
			lowercase: true,
			minlength: [3, "Username must be at least 3 characters"],
			maxlength: [30, "Username cannot exceed 30 characters"],
			match: [
				/^[a-zA-Z0-9_]+$/,
				"Username can only contain letters, numbers, and underscores",
			],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters"],
		},
		avatar: {
			mime: {
				type: String,
				default: "image/png",
			},
			data: {
				type: String,
				default: "",
			},
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		savedFilms: {
			type: [String],
			default: [],
		},
		watchHistory: [
			{
				filmSlug: {
					type: String,
					required: true,
				},
				episodeSlug: {
					type: String,
					required: true,
				},
				episodeName: {
					type: String,
					default: "",
				},
				serverIdx: {
					type: Number,
					default: 0,
				},
				watchedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		ratings: [
			{
				filmSlug: {
					type: String,
					required: true,
				},
				score: {
					type: Number,
					required: true,
					min: 1,
					max: 10,
				},
				ratedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		isVerified: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	},
);

userSchema.pre("save", async function () {
	if (!this.isModified("password")) return;

	const salt = await bcrypt.genSalt(12);
	this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (
	candidatePassword: string,
): Promise<boolean> {
	return bcrypt.compare(candidatePassword, this.password);
};

if (mongoose.models.User) {
	delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
