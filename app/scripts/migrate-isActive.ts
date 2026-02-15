/**
 * Script migration để thêm trường 'isActive' vào tất cả các user hiện có
 *
 * Mục đích: Cập nhật tất cả các document trong collection 'users'
 * để có trường 'isActive: true' nếu chưa có
 *
 * Cách chạy:
 *   npx tsx app/scripts/migrate-isActive.ts
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

import User from "../models/User";

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

async function migrateIsActiveField() {
    try {
        console.log("🚀 Bắt đầu migration trường 'isActive' cho User...\n");

        await connectDatabase();

        // Đếm số user chưa có trường isActive hoặc isActive = null
        const usersToUpdate = await User.countDocuments({
            $or: [{ isActive: { $exists: false } }, { isActive: null }],
        });

        console.log(`📊 Tìm thấy ${usersToUpdate} user cần cập nhật`);

        if (usersToUpdate === 0) {
            console.log(
                "✅ Tất cả user đã có trường 'isActive'. Không cần migration.",
            );
            return;
        }

        // Cập nhật tất cả user chưa có trường isActive
        const result = await User.updateMany(
            {
                $or: [{ isActive: { $exists: false } }, { isActive: null }],
            },
            {
                $set: { isActive: true },
            },
        );

        console.log(`\n✅ Đã cập nhật thành công ${result.modifiedCount} user`);
        console.log(`📋 Matched: ${result.matchedCount}`);
        console.log(`📝 Modified: ${result.modifiedCount}`);

        // Kiểm tra lại sau khi cập nhật
        const remainingUsers = await User.countDocuments({
            $or: [{ isActive: { $exists: false } }, { isActive: null }],
        });

        if (remainingUsers === 0) {
            console.log(
                "\n✅ Migration hoàn tất! Tất cả user đã có trường 'isActive: true'",
            );
        } else {
            console.warn(`\n⚠️ Còn ${remainingUsers} user chưa được cập nhật`);
        }

        // Hiển thị thống kê
        const totalUsers = await User.countDocuments({});
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = await User.countDocuments({ isActive: false });

        console.log("\n📊 Thống kê sau migration:");
        console.log(`   - Tổng số user: ${totalUsers}`);
        console.log(`   - User đang hoạt động: ${activeUsers}`);
        console.log(`   - User bị khóa: ${inactiveUsers}`);
    } catch (error) {
        console.error("❌ Lỗi trong quá trình migration:", error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Đã ngắt kết nối MongoDB");
    }
}

// Chạy migration
migrateIsActiveField()
    .then(() => {
        console.log("\n✅ Migration script hoàn tất");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Migration script thất bại:", error);
        process.exit(1);
    });
