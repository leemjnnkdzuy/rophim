import mongoose, {Schema, Document, Model} from "mongoose";

/**
 * Interface cho một thẻ danh mục tùy chỉnh trên trang chủ
 */
export interface ICategoryCard {
	_id?: string; // MongoDB ObjectId (string format)
	title: string; // Tiêu đề danh mục (VD: "Grocery", "Educational")
	bgImage: string; // Ảnh nền dạng base64 (admin upload)
	href: string; // Link điều hướng khi click (auto-generated: /danh-muc/{_id})
	color: string; // Màu nền chủ đạo (VD: "#E8D5FF", "#FFEAA7")
	order: number; // Thứ tự hiển thị
	filmSlugs: string[]; // Danh sách slug phim trong danh mục
}

/**
 * Interface đại diện cho cấu trúc dữ liệu HomeContent trong MongoDB.
 * Lưu cấu hình nội dung trang chủ do admin quản lý.
 */
export interface IHomeContent extends Document {
	// Danh sách slug phim được admin chọn hiển thị ở hero section (tối đa 5)
	featuredFilmSlugs: string[];

	// Danh sách thẻ danh mục tùy chỉnh
	categoryCards: ICategoryCard[];

	// Thời gian cập nhật
	updatedAt: Date;
	createdAt: Date;
}

const CategoryCardSchema: Schema = new Schema(
	{
		title: {type: String, required: true},
		bgImage: {type: String, default: ""}, // base64 encoded image
		href: {type: String, required: true},
		color: {type: String, default: "#E8D5FF"},
		order: {type: Number, default: 0},
		filmSlugs: {type: [String], default: []}, // Danh sách slug phim
	},
	{_id: true},
);

const HomeContentSchema: Schema = new Schema(
	{
		// Slug phim nổi bật do admin chọn (tối đa 5)
		featuredFilmSlugs: {
			type: [String],
			default: [],
			validate: {
				validator: (v: string[]) => v.length <= 5,
				message: "Tối đa 5 phim nổi bật",
			},
		},

		// Thẻ danh mục tùy chỉnh
		categoryCards: {
			type: [CategoryCardSchema],
			default: [],
			validate: {
				validator: (v: ICategoryCard[]) => v.length <= 6,
				message: "Tối đa 6 thẻ danh mục",
			},
		},
	},
	{
		timestamps: true,
	},
);

/**
 * Xuất Model HomeContent.
 * Chỉ có 1 document duy nhất trong collection này (singleton pattern).
 */
const HomeContent: Model<IHomeContent> =
	mongoose.models.HomeContent ||
	mongoose.model<IHomeContent>("HomeContent", HomeContentSchema);

export default HomeContent;
