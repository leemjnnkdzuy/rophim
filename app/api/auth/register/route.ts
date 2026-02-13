import {NextRequest, NextResponse} from "next/server";
import {generatePIN, sendVerificationEmail} from "@/app/utils/sendMail";
import connectDatabase from "@/app/utils/connectDB";
import User from "@/app/models/User";
import defaultAvatar from "@/app/assets/defualtAvatar.json";

// In-memory store for PINs (in production, use Redis or database)
const pinStore = new Map<
	string,
	{
		pin: string;
		expiresAt: number;
		userData: {username: string; email: string; password: string};
	}
>();

// Clean up expired PINs
function cleanupExpiredPins() {
	const now = Date.now();
	for (const [email, data] of pinStore.entries()) {
		if (data.expiresAt < now) {
			pinStore.delete(email);
		}
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {action, email, username, password, pin} = body;

		cleanupExpiredPins();

		if (action === "send-pin") {
			// Validate required fields
			if (!email || !username || !password) {
				return NextResponse.json(
					{success: false, error: "Vui lòng điền đầy đủ thông tin"},
					{status: 400},
				);
			}

			// Validate username format
			if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
				return NextResponse.json(
					{
						success: false,
						error: "Username chỉ được chứa chữ cái, số và dấu gạch dưới (3-30 ký tự)",
					},
					{status: 400},
				);
			}

			// Connect to database
			await connectDatabase();

			// Check if email already exists
			const existingEmail = await User.findOne({
				email: email.toLowerCase(),
			});
			if (existingEmail) {
				return NextResponse.json(
					{success: false, error: "Email này đã được sử dụng"},
					{status: 400},
				);
			}

			// Check if username already exists
			const existingUsername = await User.findOne({
				username: username.toLowerCase(),
			});
			if (existingUsername) {
				return NextResponse.json(
					{success: false, error: "Username này đã được sử dụng"},
					{status: 400},
				);
			}

			// Generate new PIN
			const newPin = generatePIN();
			const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

			// Store PIN with user data
			pinStore.set(email.toLowerCase(), {
				pin: newPin,
				expiresAt,
				userData: {
					username: username.toLowerCase(),
					email: email.toLowerCase(),
					password,
				},
			});

			// Send email
			const result = await sendVerificationEmail(email, newPin, username);

			if (result.success) {
				return NextResponse.json({
					success: true,
					message: "Mã PIN đã được gửi đến email của bạn",
				});
			} else {
				return NextResponse.json(
					{
						success: false,
						error: "Không thể gửi email. Vui lòng thử lại.",
					},
					{status: 500},
				);
			}
		}

		if (action === "verify-pin") {
			// Validate required fields
			if (!email || !pin) {
				return NextResponse.json(
					{success: false, error: "Thiếu email hoặc mã PIN"},
					{status: 400},
				);
			}

			// Get stored PIN data
			const storedData = pinStore.get(email.toLowerCase());

			if (!storedData) {
				return NextResponse.json(
					{
						success: false,
						error: "Mã PIN đã hết hạn. Vui lòng yêu cầu mã mới.",
					},
					{status: 400},
				);
			}

			// Check if PIN is expired
			if (storedData.expiresAt < Date.now()) {
				pinStore.delete(email.toLowerCase());
				return NextResponse.json(
					{
						success: false,
						error: "Mã PIN đã hết hạn. Vui lòng yêu cầu mã mới.",
					},
					{status: 400},
				);
			}

			// Verify PIN
			if (storedData.pin !== pin) {
				return NextResponse.json(
					{
						success: false,
						error: "Mã PIN không đúng. Vui lòng thử lại.",
					},
					{status: 400},
				);
			}

			// PIN is valid - Create user in database
			const userData = storedData.userData;

			try {
				// Connect to database
				await connectDatabase();

				// Create new user
				const newUser = new User({
					username: userData.username,
					email: userData.email,
					password: userData.password,
					avatar: {
						mime: defaultAvatar.image.mime,
						data: defaultAvatar.image.data,
					},
					isVerified: true,
				});

				await newUser.save();

				// Clean up the PIN
				pinStore.delete(email.toLowerCase());

				console.log("User created successfully:", userData.email);

				return NextResponse.json({
					success: true,
					message: "Tài khoản đã được tạo thành công",
					user: {
						username: userData.username,
						email: userData.email,
					},
				});
			} catch (dbError) {
				console.error("Database error:", dbError);

				if ((dbError as {code?: number}).code === 11000) {
					const errorMessage = String(dbError);
					if (errorMessage.includes("username")) {
						return NextResponse.json(
							{
								success: false,
								error: "Username này đã được sử dụng",
							},
							{status: 400},
						);
					}
					if (errorMessage.includes("email")) {
						return NextResponse.json(
							{
								success: false,
								error: "Email này đã được sử dụng",
							},
							{status: 400},
						);
					}
					return NextResponse.json(
						{
							success: false,
							error: "Email hoặc Username này đã được sử dụng",
						},
						{status: 400},
					);
				}

				if ((dbError as {name?: string}).name === "ValidationError") {
					const validationError = dbError as {message?: string};
					return NextResponse.json(
						{
							success: false,
							error:
								validationError.message ||
								"Dữ liệu không hợp lệ",
						},
						{status: 400},
					);
				}

				return NextResponse.json(
					{
						success: false,
						error: `Không thể tạo tài khoản: ${(dbError as Error).message}`,
					},
					{status: 500},
				);
			}
		}

		return NextResponse.json(
			{success: false, error: "Hành động không hợp lệ"},
			{status: 400},
		);
	} catch (error) {
		console.error("Registration error:", error);
		return NextResponse.json(
			{success: false, error: "Lỗi server. Vui lòng thử lại sau."},
			{status: 500},
		);
	}
}
