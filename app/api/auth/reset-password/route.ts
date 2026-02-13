import {NextRequest, NextResponse} from "next/server";
import {generatePIN, sendPasswordResetEmail} from "@/app/utils/sendMail";
import connectDatabase from "@/app/utils/connectDB";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";

const resetPinStore = new Map<string, {pin: string; expiresAt: number}>();

function cleanupExpiredPins() {
	const now = Date.now();
	for (const [email, data] of resetPinStore.entries()) {
		if (data.expiresAt < now) {
			resetPinStore.delete(email);
		}
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {action, email, pin, newPassword} = body;

		cleanupExpiredPins();

		if (action === "send-pin") {
			if (!email) {
				return NextResponse.json(
					{success: false, error: "Vui lòng nhập email"},
					{status: 400},
				);
			}

			await connectDatabase();

			const user = await User.findOne({email: email.toLowerCase()});
			if (!user) {
				return NextResponse.json(
					{
						success: false,
						error: "Không tìm thấy tài khoản với email này",
					},
					{status: 400},
				);
			}

			const newPin = generatePIN();
			const expiresAt = Date.now() + 10 * 60 * 1000;

			resetPinStore.set(email.toLowerCase(), {
				pin: newPin,
				expiresAt,
			});

			const result = await sendPasswordResetEmail(email, newPin);

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
			if (!email || !pin) {
				return NextResponse.json(
					{success: false, error: "Thiếu email hoặc mã PIN"},
					{status: 400},
				);
			}

			const storedData = resetPinStore.get(email.toLowerCase());

			if (!storedData) {
				return NextResponse.json(
					{
						success: false,
						error: "Mã PIN đã hết hạn. Vui lòng yêu cầu mã mới.",
					},
					{status: 400},
				);
			}

			if (storedData.expiresAt < Date.now()) {
				resetPinStore.delete(email.toLowerCase());
				return NextResponse.json(
					{
						success: false,
						error: "Mã PIN đã hết hạn. Vui lòng yêu cầu mã mới.",
					},
					{status: 400},
				);
			}

			if (storedData.pin !== pin) {
				return NextResponse.json(
					{
						success: false,
						error: "Mã PIN không đúng. Vui lòng thử lại.",
					},
					{status: 400},
				);
			}

			resetPinStore.set(email.toLowerCase(), {
				...storedData,
				expiresAt: Date.now() + 5 * 60 * 1000,
			});

			return NextResponse.json({
				success: true,
				message: "Mã PIN hợp lệ. Bạn có thể đặt mật khẩu mới.",
			});
		}

		if (action === "reset-password") {
			if (!email || !newPassword) {
				return NextResponse.json(
					{success: false, error: "Thiếu email hoặc mật khẩu mới"},
					{status: 400},
				);
			}

			if (newPassword.length < 6) {
				return NextResponse.json(
					{success: false, error: "Mật khẩu phải có ít nhất 6 ký tự"},
					{status: 400},
				);
			}

			const storedData = resetPinStore.get(email.toLowerCase());

			if (!storedData) {
				return NextResponse.json(
					{
						success: false,
						error: "Phiên đã hết hạn. Vui lòng bắt đầu lại.",
					},
					{status: 400},
				);
			}

			if (storedData.expiresAt < Date.now()) {
				resetPinStore.delete(email.toLowerCase());
				return NextResponse.json(
					{
						success: false,
						error: "Phiên đã hết hạn. Vui lòng bắt đầu lại.",
					},
					{status: 400},
				);
			}

			await connectDatabase();

			const user = await User.findOne({email: email.toLowerCase()});
			if (!user) {
				return NextResponse.json(
					{success: false, error: "Không tìm thấy tài khoản"},
					{status: 404},
				);
			}

			const salt = await bcrypt.genSalt(12);
			const hashedPassword = await bcrypt.hash(newPassword, salt);

			user.password = hashedPassword;
			await user.save();

			resetPinStore.delete(email.toLowerCase());

			return NextResponse.json({
				success: true,
				message: "Mật khẩu đã được đặt lại thành công",
			});
		}

		return NextResponse.json(
			{success: false, error: "Hành động không hợp lệ"},
			{status: 400},
		);
	} catch (error) {
		console.error("Reset password error:", error);
		return NextResponse.json(
			{success: false, error: "Lỗi server. Vui lòng thử lại sau."},
			{status: 500},
		);
	}
}
