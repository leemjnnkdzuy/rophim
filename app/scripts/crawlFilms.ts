/**
 * Script cào dữ liệu phim từ API phim.nguonc.com
 *
 * Quy trình:
 * 1. Lấy danh sách phim từ API "phim-moi-cap-nhat" (duyệt từng page)
 * 2. Với mỗi phim, gọi API chi tiết để lấy thông tin category (thể loại, quốc gia, năm, định dạng)
 * 3. Lưu hoặc cập nhật (upsert) vào MongoDB theo slug
 *
 * Cách chạy:
 *   npx ts-node --project tsconfig.json app/scripts/crawlFilms.ts
 *   hoặc
 *   npx tsx app/scripts/crawlFilms.ts
 */

import Link from "next/link";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

// Force Node.js to use Google DNS to bypass ISP blocking/issues with SRV records
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log("🌍 Đã thiết lập DNS Google (8.8.8.8)");
} catch (e) {
    console.warn("⚠️ Không thể thiết lập DNS thủ công:", e);
}

dotenv.config();

import Film, { ICategoryItem } from "../models/Film";

// ===================== CẤU HÌNH =====================

const BASE_URL = "https://phim.nguonc.com/api";
const LIST_ENDPOINT = `${BASE_URL}/films/phim-moi-cap-nhat`;
const DETAIL_ENDPOINT = `${BASE_URL}/film`;

// Số trang muốn cào (đặt 0 để cào TẤT CẢ các trang)
const MAX_PAGES = 0;

// Thời gian chờ giữa mỗi request (ms) để tránh bị rate limit
const DELAY_BETWEEN_REQUESTS = 300;

// ===================== HELPER =====================

/**
 * Hàm chờ (sleep) một khoảng thời gian
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch với retry logic
 */
async function fetchWithRetry(url: string, retries: number = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`⚠️  Retry ${i + 1}/${retries} cho URL: ${url}`);
            await sleep(1000 * (i + 1)); // Tăng dần thời gian chờ
        }
    }
}

/**
 * Phân tích category từ API chi tiết thành các mảng riêng biệt
 * Category API trả về dạng: { "1": { group: { name: "Định dạng" }, list: [...] }, "2": { ... } }
 */
function parseCategories(category: Record<string, any>): {
    formats: ICategoryItem[];
    genres: ICategoryItem[];
    years: ICategoryItem[];
    countries: ICategoryItem[];
} {
    const result = {
        formats: [] as ICategoryItem[],
        genres: [] as ICategoryItem[],
        years: [] as ICategoryItem[],
        countries: [] as ICategoryItem[],
    };

    if (!category) return result;

    for (const key of Object.keys(category)) {
        const group = category[key];
        const groupName = group?.group?.name;
        const list: ICategoryItem[] = (group?.list || []).map((item: any) => ({
            id: item.id,
            name: item.name,
        }));

        switch (groupName) {
            case "Định dạng":
                result.formats = list;
                break;
            case "Thể loại":
                result.genres = list;
                break;
            case "Năm":
                result.years = list;
                break;
            case "Quốc gia":
                result.countries = list;
                break;
            default:
                console.warn(`⚠️  Nhóm category chưa xử lý: "${groupName}"`);
        }
    }

    return result;
}

// ===================== KÍCH THƯỚC KẾT NỐI DB =====================

async function connectDB(): Promise<void> {
    // Ưu tiên dùng MONGODB_URI trực tiếp nếu có
    let uri = process.env.MONGODB_URI;

    if (!uri) {
        const username = process.env.MONGODB_USER;
        const password = process.env.MONGODB_PASSWORD;
        const cluster = process.env.MONGODB_CLUSTER;
        const database = process.env.MONGODB_DATABASE_DEVELOPMENT || process.env.MONGODB_DATABASE_PROD;

        if (!username || !password || !cluster || !database) {
            throw new Error("❌ Thiếu biến môi trường MongoDB. Cần có MONGODB_URI hoặc MONGODB_USER, MONGODB_PASSWORD, MONGODB_CLUSTER, MONGODB_DATABASE_DEVELOPMENT");
        }

        uri = `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;
    }

    console.log(`🔌 Đang kết nối MongoDB...`);
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
    });
    console.log(`✅ Đã kết nối MongoDB thành công!`);
}

// Số phim xử lý đồng thời (Concurrent Limit)
const CONCURRENT_LIMIT = 5;

// ===================== LOGIC CÀO DỮ LIỆU =====================

/**
 * Lấy danh sách phim từ 1 trang
 */
async function fetchFilmList(page: number): Promise<{ items: any[]; totalPage: number }> {
    const url = `${LIST_ENDPOINT}?page=${page}`;
    const data = await fetchWithRetry(url);

    return {
        items: data.items || [],
        totalPage: data.paginate?.total_page || 1,
    };
}

/**
 * Lấy chi tiết 1 phim theo slug
 */
async function fetchFilmDetail(slug: string): Promise<any> {
    const url = `${DETAIL_ENDPOINT}/${slug}`;
    const data = await fetchWithRetry(url);
    return data.movie || null;
}

/**
 * Xử lý và lưu 1 phim vào DB
 */
async function processAndSaveFilm(listItem: any): Promise<boolean> {
    const slug = listItem.slug;

    try {
        // Lấy chi tiết phim để có category
        const detail = await fetchFilmDetail(slug);

        // Phân tích category thành formats, genres, years, countries
        const categories = detail
            ? parseCategories(detail.category)
            : { formats: [], genres: [], years: [], countries: [] };

        // Chuẩn bị dữ liệu để lưu
        const filmData = {
            name: listItem.name,
            slug: listItem.slug,
            original_name: listItem.original_name || "",
            description: listItem.description || "",
            thumb_url: listItem.thumb_url || "",
            poster_url: listItem.poster_url || "",
            created: listItem.created ? new Date(listItem.created) : undefined,
            modified: listItem.modified ? new Date(listItem.modified) : undefined,
            total_episodes: listItem.total_episodes || 0,
            time: listItem.time || "",
            quality: listItem.quality || "",
            language: listItem.language || "",
            director: listItem.director || "",
            casts: listItem.casts || "",
            // Category
            formats: categories.formats,
            genres: categories.genres,
            years: categories.years,
            countries: categories.countries,
        };

        // Upsert: Nếu slug đã tồn tại thì cập nhật, nếu chưa thì tạo mới
        // Không ghi đè rating, views, is_featured (giữ nguyên dữ liệu nội bộ)
        await Film.findOneAndUpdate(
            { slug: filmData.slug },
            { $set: filmData },
            { upsert: true, new: true }
        );

        console.log(`   ✅ ${filmData.name}`);
        return true;
    } catch (error) {
        console.error(`   ❌ Lỗi khi xử lý phim "${slug}":`, error);
        return false;
    }
}

/**
 * Chia mảng thành các chunk nhỏ
 */
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// ===================== HÀM CHÍNH =====================

async function main(): Promise<void> {
    console.log("🎬 ========================================");
    console.log("🎬  SCRIPT CÀO DỮ LIỆU PHIM (ĐA LUỒNG)");
    console.log("🎬 ========================================\n");

    // 1. Kết nối DB
    await connectDB();

    // 2. Xóa index cũ và đồng bộ index mới (sửa lỗi language_override)
    console.log("🔄 Đang xóa index cũ và tạo lại...");
    try {
        await Film.collection.dropIndexes();
        console.log("   🗑️  Đã xóa tất cả index cũ");
    } catch (e) {
        console.warn("   ⚠️  Không thể xóa index (collection có thể chưa tồn tại):", e);
    }
    await Film.syncIndexes();
    console.log("✅ Đã đồng bộ indexes xong!");

    // 3. Lấy trang đầu tiên để biết tổng số trang
    console.log("\n📋 Đang lấy thông tin từ API...");
    const firstPage = await fetchFilmList(1);
    const totalPages = MAX_PAGES > 0 ? Math.min(MAX_PAGES, firstPage.totalPage) : firstPage.totalPage;
    console.log(`📊 Tổng số trang: ${firstPage.totalPage} | Sẽ cào: ${totalPages} trang\n`);

    let totalProcessed = 0;
    let totalErrors = 0;

    // 4. Duyệt từng trang
    for (let page = 1; page <= totalPages; page++) {
        console.log(`\n📄 === TRANG ${page}/${totalPages} ===`);

        try {
            const { items } = page === 1 ? firstPage : await fetchFilmList(page);
            console.log(`   Tìm thấy ${items.length} phim. Đang xử lý ${CONCURRENT_LIMIT} luồng...`);

            // Chia danh sách phim thành các chunk nhỏ để xử lý song song
            const chunks = chunkArray(items, CONCURRENT_LIMIT);

            for (const chunk of chunks) {
                // Xử lý song song các phim trong chunk
                const results = await Promise.all(
                    chunk.map((item) => processAndSaveFilm(item))
                );

                // Thống kê kết quả
                const successCount = results.filter((r) => r).length;
                totalProcessed += successCount;
                totalErrors += results.length - successCount;

                // Nghỉ một chút giữa các chunk để tránh DDOS server
                await sleep(DELAY_BETWEEN_REQUESTS);
            }

        } catch (error) {
            console.error(`❌ Lỗi khi xử lý trang ${page}:`, error);
            totalErrors++;
        }
    }

    // 5. Kết quả
    console.log("\n🎬 ========================================");
    console.log(`🎬  HOÀN TẤT`);
    console.log(`🎬  Tổng phim đã xử lý: ${totalProcessed}`);
    console.log(`🎬  Tổng lỗi: ${totalErrors}`);
    console.log("🎬 ========================================\n");

    // 6. Đóng kết nối
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
}

// Chạy script
main().catch((error) => {
    console.error("💥 Lỗi nghiêm trọng:", error);
    mongoose.disconnect();
    process.exit(1);
});
