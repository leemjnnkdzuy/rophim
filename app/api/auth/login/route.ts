import {NextRequest, NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import User from "@/app/models/User";
import {
	generateAccessToken,
	generateRefreshToken,
	cookieOptions,
	ACCESS_TOKEN_MAX_AGE,
	REFRESH_TOKEN_SHORT_MAX_AGE,
	REFRESH_TOKEN_LONG_MAX_AGE,
} from "@/app/utils/jwt";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {identifier, password, rememberMe = false} = body;

		if (!identifier || !password) {
			return NextResponse.json(
				{
					success: false,
					message: "Vui lòng nhập email/username và mật khẩu",
				},
				{status: 400},
			);
		}

		await connectDatabase();

		const isEmail = identifier.includes("@");

		const user =
			isEmail ?
				await User.findOne({email: identifier.toLowerCase()})
			:	await User.findOne({username: identifier.toLowerCase()});

		if (!user) {
			return NextResponse.json(
				{
					success: false,
					message: "Email/Username hoặc mật khẩu không đúng",
				},
				{status: 401},
			);
		}

		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			return NextResponse.json(
				{
					success: false,
					message: "Email/Username hoặc mật khẩu không đúng",
				},
				{status: 401},
			);
		}

		if (!user.isVerified) {
			return NextResponse.json(
				{success: false, message: "Tài khoản chưa được xác thực"},
				{status: 401},
			);
		}

		const userId = user._id.toString();
		const accessToken = generateAccessToken(userId);
		const refreshToken = generateRefreshToken(userId, rememberMe);

		const refreshTokenMaxAge =
			rememberMe ?
				REFRESH_TOKEN_LONG_MAX_AGE
			:	REFRESH_TOKEN_SHORT_MAX_AGE;

		const userData = {
			id: user._id.toString(),
			username: user.username,
			email: user.email,
			avatar:
				user.avatar ?
					`data:${user.avatar.mime};base64,${user.avatar.data}`
				:	null,
			isVerified: user.isVerified,
			createdAt: user.createdAt,
		};

		const response = NextResponse.json({
			success: true,
			message: "Đăng nhập thành công",
			user: userData,
		});

		response.cookies.set("access_token", accessToken, {
			...cookieOptions,
			maxAge: ACCESS_TOKEN_MAX_AGE / 1000,
		});

		response.cookies.set("refresh_token", refreshToken, {
			...cookieOptions,
			maxAge: refreshTokenMaxAge / 1000,
		});

		console.log("User logged in successfully:", user.email);

		return response;
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json(
			{success: false, message: "Lỗi server. Vui lòng thử lại sau."},
			{status: 500},
		);
	}
}
