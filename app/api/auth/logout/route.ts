import {NextResponse} from "next/server";
import {cookieOptions} from "@/app/utils/jwt";

export async function POST() {
	try {
		const response = NextResponse.json({
			success: true,
			message: "Đăng xuất thành công",
		});

		response.cookies.set("access_token", "", {
			...cookieOptions,
			maxAge: 0,
		});

		response.cookies.set("refresh_token", "", {
			...cookieOptions,
			maxAge: 0,
		});

		return response;
	} catch (error) {
		console.error("Logout error:", error);
		return NextResponse.json(
			{success: false, message: "Lỗi server. Vui lòng thử lại sau."},
			{status: 500},
		);
	}
}
