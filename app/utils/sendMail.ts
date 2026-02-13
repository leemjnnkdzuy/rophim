import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

export function generatePIN(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getVerificationEmailTemplate(
	pin: string,
	userName: string,
): string {
	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Xác thực tài khoản</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
	<table role="presentation" style="width: 100%; border-collapse: collapse;">
		<tr>
			<td align="center" style="padding: 40px 0;">
				<table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);">
					<!-- Header -->
					<tr>
						<td style="padding: 40px 40px 24px; text-align: center;">
							<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">
								Rophim
							</h1>
						</td>
					</tr>
					
					<!-- Content -->
					<tr>
						<td style="padding: 0 40px;">
							<p style="margin: 0 0 8px; font-size: 16px; color: #1a1a1a;">
								Xin chào <strong>${userName}</strong>,
							</p>
							<p style="margin: 0 0 24px; font-size: 14px; color: #666666; line-height: 1.6;">
								Cảm ơn bạn đã đăng ký tài khoản tại Rophim. Vui lòng sử dụng mã PIN bên dưới để xác thực tài khoản của bạn:
							</p>
						</td>
					</tr>
					
					<!-- PIN Code -->
					<tr>
						<td style="padding: 0 40px 24px;">
							<div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); border-radius: 12px; padding: 24px; text-align: center;">
								<p style="margin: 0 0 8px; font-size: 12px; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; letter-spacing: 2px;">
									Mã xác thực
								</p>
								<p style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
									${pin}
								</p>
							</div>
						</td>
					</tr>
					
					<!-- Warning -->
					<tr>
						<td style="padding: 0 40px 32px;">
							<p style="margin: 0; font-size: 13px; color: #999999; line-height: 1.5; text-align: center;">
								Mã PIN này sẽ hết hạn sau <strong style="color: #666;">10 phút</strong>.<br>
								Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
							</p>
						</td>
					</tr>
					
					<!-- Footer -->
					<tr>
						<td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; border-top: 1px solid #eeeeee;">
							<p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
								© 2026 Rophim. All rights reserved.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`;
}

export async function sendVerificationEmail(
	email: string,
	pin: string,
	userName: string,
): Promise<{success: boolean; error?: string}> {
	try {
		await transporter.sendMail({
			from: `"Rophim" <${process.env.SMTP_USER}>`,
			to: email,
			subject: "Xác thực tài khoản - Rophim",
			html: getVerificationEmailTemplate(pin, userName),
		});
		return {success: true};
	} catch (error) {
		console.error("Error sending email:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to send email",
		};
	}
}

export function getPasswordResetEmailTemplate(
	pin: string,
	userEmail: string,
): string {
	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Đặt lại mật khẩu</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
	<table role="presentation" style="width: 100%; border-collapse: collapse;">
		<tr>
			<td align="center" style="padding: 40px 0;">
				<table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);">
					<!-- Header -->
					<tr>
						<td style="padding: 40px 40px 24px; text-align: center;">
							<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">
								Rophim
							</h1>
						</td>
					</tr>
					
					<!-- Content -->
					<tr>
						<td style="padding: 0 40px;">
							<p style="margin: 0 0 8px; font-size: 16px; color: #1a1a1a;">
								Xin chào,
							</p>
							<p style="margin: 0 0 24px; font-size: 14px; color: #666666; line-height: 1.6;">
								Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${userEmail}</strong>. Vui lòng sử dụng mã PIN bên dưới để đặt lại mật khẩu của bạn:
							</p>
						</td>
					</tr>
					
					<!-- PIN Code -->
					<tr>
						<td style="padding: 0 40px 24px;">
							<div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 12px; padding: 24px; text-align: center;">
								<p style="margin: 0 0 8px; font-size: 12px; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; letter-spacing: 2px;">
									Mã đặt lại mật khẩu
								</p>
								<p style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
									${pin}
								</p>
							</div>
						</td>
					</tr>
					
					<!-- Warning -->
					<tr>
						<td style="padding: 0 40px 32px;">
							<p style="margin: 0; font-size: 13px; color: #999999; line-height: 1.5; text-align: center;">
								Mã PIN này sẽ hết hạn sau <strong style="color: #666;">10 phút</strong>.<br>
								Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
							</p>
						</td>
					</tr>
					
					<!-- Footer -->
					<tr>
						<td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; border-top: 1px solid #eeeeee;">
							<p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
								© 2026 Rophim. All rights reserved.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`;
}

export async function sendPasswordResetEmail(
	email: string,
	pin: string,
): Promise<{success: boolean; error?: string}> {
	try {
		await transporter.sendMail({
			from: `"Rophim" <${process.env.SMTP_USER}>`,
			to: email,
			subject: "Đặt lại mật khẩu - Rophim",
			html: getPasswordResetEmailTemplate(pin, email),
		});
		return {success: true};
	} catch (error) {
		console.error("Error sending password reset email:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to send email",
		};
	}
}

export default transporter;
