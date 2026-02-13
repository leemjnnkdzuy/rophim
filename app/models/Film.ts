import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Interface cho từng mục trong danh sách category (VD: "Phim bộ", "Hình Sự", "2026", "Trung Quốc")
 */
export interface ICategoryItem {
    id: string;   // ID danh mục từ API nguồn
    name: string; // Tên danh mục (VD: "Hình Sự", "Cổ Trang")
}

/**
 * Interface đại diện cho cấu trúc dữ liệu của một bộ phim (Film) trong MongoDB.
 */
export interface IFilm extends Document {
    // === Thông tin cơ bản ===
    name: string;           // Tên phim (Tiếng Việt hoặc tên chính thức tại VN)
    slug: string;           // Đường dẫn thân thiện cho URL (VD: "hung-long-phong-ba-phan-4")
    original_name: string;  // Tên gốc của phim (Tiếng Anh, Tiếng Trung, v.v.)
    description: string;    // Nội dung tóm tắt / mô tả chi tiết của phim

    // === Hình ảnh ===
    thumb_url: string;      // URL ảnh ngang / thumbnail (dùng cho danh sách, card)
    poster_url: string;     // URL ảnh dọc / poster (dùng cho trang chi tiết, hero)

    // === Thời gian từ API nguồn ===
    created: Date;          // Ngày tạo phim trên hệ thống bên cung cấp API
    modified: Date;         // Ngày cập nhật phim gần nhất trên hệ thống bên cung cấp API

    // === Thông tin tập phim & thời lượng ===
    total_episodes: number; // Tổng số tập phim dự kiến
    time: string;           // Thời lượng phim (VD: "32 phút/tập", "120 phút")

    // === Chất lượng & Ngôn ngữ ===
    quality: string;        // Chất lượng hình ảnh (VD: "HD", "FHD", "4K")
    language: string;       // Ngôn ngữ / Phụ đề (VD: "Vietsub", "Thuyết minh", "Vietsub + Thuyết Minh")

    // === Đội ngũ sản xuất ===
    director: string;       // Tên đạo diễn
    casts: string;          // Danh sách dàn diễn viên (chuỗi phân cách bằng dấu phẩy)

    // === Phân loại (cho filter/tìm kiếm) ===
    formats: ICategoryItem[];   // Định dạng phim (VD: "Phim bộ", "Phim đang chiếu", "Phim lẻ")
    genres: ICategoryItem[];    // Thể loại phim (VD: "Hình Sự", "Cổ Trang", "Bí Ẩn")
    years: ICategoryItem[];     // Năm phát hành (VD: "2026", "2025")
    countries: ICategoryItem[]; // Quốc gia sản xuất (VD: "Trung Quốc", "Hàn Quốc")

    // === Dữ liệu nội bộ (không lấy từ API nguồn) ===
    rating: number;         // Điểm đánh giá trung bình (0-10), mặc định 0
    views: number;          // Tổng lượt xem, mặc định 0
    is_featured: boolean;   // Đánh dấu phim nổi bật / đề xuất trên trang chủ
}

// === Schema cho CategoryItem (dùng nhúng trong Film) ===
const CategoryItemSchema: Schema = new Schema(
    {
        id: { type: String },
        name: { type: String },
    },
    { _id: false } // Không tạo _id riêng cho mỗi item nhúng
);

/**
 * Mongoose Schema định nghĩa cấu trúc bảng 'films' trong MongoDB.
 */
const FilmSchema: Schema = new Schema(
    {
        // Tên phim: Bắt buộc, đánh chỉ mục text để hỗ trợ tìm kiếm
        name: { type: String, required: true },

        // Slug: Bắt buộc, duy nhất, đánh chỉ mục để truy vấn nhanh theo URL
        slug: { type: String, required: true, unique: true, index: true },

        // Tên gốc
        original_name: { type: String },

        // Mô tả chi tiết nội dung
        description: { type: String },

        // Link ảnh thumbnail và poster
        thumb_url: { type: String },
        poster_url: { type: String },

        // Thời điểm tạo và cập nhật từ API gốc
        created: { type: Date },
        modified: { type: Date },

        // Thông tin tập phim
        total_episodes: { type: Number, default: 0 },
        time: { type: String },

        // Chất lượng và ngôn ngữ
        quality: { type: String },
        language: { type: String },

        // Đạo diễn và diễn viên
        director: { type: String },
        casts: { type: String },

        // === Phân loại - đánh chỉ mục để filter nhanh ===
        formats: { type: [CategoryItemSchema], default: [] },     // Định dạng (Phim bộ, Phim đang chiếu, ...)
        genres: { type: [CategoryItemSchema], default: [] },      // Thể loại (Hình Sự, Cổ Trang, ...)
        years: { type: [CategoryItemSchema], default: [] },       // Năm (2026, 2025, ...)
        countries: { type: [CategoryItemSchema], default: [] },   // Quốc gia (Trung Quốc, Hàn Quốc, ...)

        // === Dữ liệu nội bộ ===
        rating: { type: Number, default: 0, min: 0, max: 10 },   // Điểm đánh giá (0-10)
        views: { type: Number, default: 0 },                     // Lượt xem
        is_featured: { type: Boolean, default: false },           // Phim nổi bật
    },
    {
        // Tự động thêm createdAt và updatedAt bởi Mongoose
        timestamps: true,
    }
);

// Vô hiệu hóa language_override mặc định (tránh lỗi khi field 'language' chứa giá trị không chuẩn ISO)
FilmSchema.index({ name: "text", original_name: "text" }, { language_override: "dummy_language_override" });

// === Đánh chỉ mục phục vụ tìm kiếm và filter ===
FilmSchema.index({ "genres.name": 1 });      // Filter theo thể loại
FilmSchema.index({ "countries.name": 1 });   // Filter theo quốc gia
FilmSchema.index({ "years.name": 1 });       // Filter theo năm
FilmSchema.index({ "formats.name": 1 });     // Filter theo định dạng
FilmSchema.index({ views: -1 });             // Sắp xếp theo lượt xem giảm dần
FilmSchema.index({ rating: -1 });            // Sắp xếp theo điểm giảm dần
FilmSchema.index({ modified: -1 });          // Sắp xếp theo ngày cập nhật mới nhất

/**
 * Xuất Model Film.
 * Sử dụng `mongoose.models.Film` để tránh lỗi "OverwriteModelError"
 * trong quá trình Hot Module Reload (HMR) của Next.js.
 */
const Film: Model<IFilm> = mongoose.models.Film || mongoose.model<IFilm>("Film", FilmSchema);

export default Film;
