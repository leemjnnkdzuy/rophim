import { NextRequest } from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import User from "@/app/models/User";
import { verifyAccessToken } from "@/app/utils/jwt";

export async function verifyAdmin(request: NextRequest) {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
        return { error: "Không tìm thấy token", status: 401 };
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload) {
        return { error: "Token không hợp lệ hoặc đã hết hạn", status: 401 };
    }

    await connectDatabase();

    const user = await User.findById(payload.userId).select("role");
    if (!user) {
        return { error: "Không tìm thấy người dùng", status: 404 };
    }

    if (user.role !== "admin") {
        return { error: "Không có quyền truy cập", status: 403 };
    }

    return { user, error: null };
}
