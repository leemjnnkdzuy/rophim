import {NextRequest, NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import User from "@/app/models/User";
import {verifyAccessToken} from "@/app/utils/jwt";

export async function GET(request: NextRequest) {
	try {
		const accessToken = request.cookies.get("access_token")?.value;

		if (!accessToken) {
			return NextResponse.json(
				{success: false, message: "Không tìm thấy token"},
				{status: 401},
			);
		}

		const payload = verifyAccessToken(accessToken);
		if (!payload) {
			return NextResponse.json(
				{success: false, message: "Token không hợp lệ hoặc đã hết hạn"},
				{status: 401},
			);
		}

		await connectDatabase();

		const user = await User.findById(payload.userId).select("-password");
		if (!user) {
			return NextResponse.json(
				{success: false, message: "Không tìm thấy người dùng"},
				{status: 404},
			);
		}

		const userData = {
			id: user._id.toString(),
			username: user.username,
			email: user.email,
			avatar:
				user.avatar ?
					`data:${user.avatar.mime};base64,${user.avatar.data}`
				:	null,
			role: user.role || "user",
			isVerified: user.isVerified,
			createdAt: user.createdAt,
		};

		return NextResponse.json({
			success: true,
			user: userData,
		});
	} catch (error) {
		console.error("Get user error:", error);
		return NextResponse.json(
			{success: false, message: "Lỗi server. Vui lòng thử lại sau."},
			{status: 500},
		);
	}
}
