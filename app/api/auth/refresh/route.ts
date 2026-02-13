import {NextRequest, NextResponse} from "next/server";
import {
	verifyRefreshToken,
	generateAccessToken,
	cookieOptions,
	ACCESS_TOKEN_MAX_AGE,
} from "@/app/utils/jwt";

export async function POST(request: NextRequest) {
	try {
		const refreshToken = request.cookies.get("refresh_token")?.value;

		if (!refreshToken) {
			return NextResponse.json(
				{success: false, message: "Không tìm thấy refresh token"},
				{status: 401},
			);
		}

		const payload = verifyRefreshToken(refreshToken);
		if (!payload) {
			const response = NextResponse.json(
				{
					success: false,
					message: "Refresh token không hợp lệ hoặc đã hết hạn",
				},
				{status: 401},
			);

			response.cookies.set("access_token", "", {
				...cookieOptions,
				maxAge: 0,
			});

			response.cookies.set("refresh_token", "", {
				...cookieOptions,
				maxAge: 0,
			});

			return response;
		}

		const newAccessToken = generateAccessToken(payload.userId);

		const response = NextResponse.json({
			success: true,
			message: "Token đã được làm mới",
		});

		response.cookies.set("access_token", newAccessToken, {
			...cookieOptions,
			maxAge: ACCESS_TOKEN_MAX_AGE / 1000,
		});

		return response;
	} catch (error) {
		console.error("Refresh token error:", error);
		return NextResponse.json(
			{success: false, message: "Lỗi server. Vui lòng thử lại sau."},
			{status: 500},
		);
	}
}
