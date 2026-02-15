/**
 * Script migration để thêm trường 'public' vào tất cả các phim hiện có
 *
 * Mục đích: Cập nhật tất cả các document trong collection 'films'
 * để có trường 'public: true' nếu chưa có
 *
 * Cách chạy:
 *   npx tsx app/scripts/migratePublicField.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

// Force Node.js to use Google DNS
try {
	dns.setServers(["8.8.8.8", "8.8.4.4"]);
	console.log("🌍 Đã thiết lập DNS Google (8.8.8.8)");
} catch (e) {
	console.warn("⚠️ Không thể thiết lập DNS thủ công:", e);
}

dotenv.config();

import Film from "../models/Film";

// ===================== MAIN FUNCTION =====================

async function connectDatabase() {
	try {
		const MONGODB_URI = process.env.MONGODB_URI;
		if (!MONGODB_URI) {
			throw new Error(
				"❌ Thiếu biến môi trường MONGODB_URI trong file .env",
			);
		}

		await mongoose.connect(MONGODB_URI);
		console.log("✅ Kết nối MongoDB thành công");
	} catch (error) {
		console.error("❌ Lỗi kết nối MongoDB:", error);
		throw error;
	}
}

async function migratePublicField() {
	try {
		console.log("🚀 Bắt đầu migration trường 'public'...\n");

		await connectDatabase();

		// Đếm số phim chưa có trường public hoặc public = null
		const filmsToUpdate = await Film.countDocuments({
			$or: [{public: {$exists: false}}, {public: null}],
		});

		console.log(`📊 Tìm thấy ${filmsToUpdate} phim cần cập nhật`);

		if (filmsToUpdate === 0) {
			console.log(
				"✅ Tất cả phim đã có trường 'public'. Không cần migration.",
			);
			return;
		}

		// Cập nhật tất cả phim chưa có trường public
		const result = await Film.updateMany(
			{
				$or: [{public: {$exists: false}}, {public: null}],
			},
			{
				$set: {public: true},
			},
		);

		console.log(`\n✅ Đã cập nhật thành công ${result.modifiedCount} phim`);
		console.log(`📋 Matched: ${result.matchedCount}`);
		console.log(`📝 Modified: ${result.modifiedCount}`);

		// Kiểm tra lại sau khi cập nhật
		const remainingFilms = await Film.countDocuments({
			$or: [{public: {$exists: false}}, {public: null}],
		});

		if (remainingFilms === 0) {
			console.log(
				"\n✅ Migration hoàn tất! Tất cả phim đã có trường 'public: true'",
			);
		} else {
			console.warn(`\n⚠️ Còn ${remainingFilms} phim chưa được cập nhật`);
		}

		// Hiển thị thống kê
		const totalFilms = await Film.countDocuments({});
		const publicFilms = await Film.countDocuments({public: true});
		const privateFilms = await Film.countDocuments({public: false});

		console.log("\n📊 Thống kê sau migration:");
		console.log(`   - Tổng số phim: ${totalFilms}`);
		console.log(`   - Phim công khai: ${publicFilms}`);
		console.log(`   - Phim ẩn: ${privateFilms}`);
	} catch (error) {
		console.error("❌ Lỗi trong quá trình migration:", error);
		throw error;
	} finally {
		await mongoose.disconnect();
		console.log("\n🔌 Đã ngắt kết nối MongoDB");
	}
}

// Chạy migration
migratePublicField()
	.then(() => {
		console.log("\n✅ Migration script hoàn tất");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n❌ Migration script thất bại:", error);
		process.exit(1);
	});
