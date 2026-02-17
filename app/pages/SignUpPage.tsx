"use client";

import {useState, useRef, useEffect} from "react";
import {
	Mail,
	Lock,
	User,
	ArrowLeft,
	CheckCircle,
	Loader2,
	Moon,
	Sun,
} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import {useRouter} from "next/navigation";

import {Button} from "@/app/components/ui/button";
import {TextInput} from "@/app/components/ui/TextInput";
import {useTheme} from "@/app/hooks/useTheme";
import {authService} from "@/app/services/AuthService";
import {useAuth} from "@/app/hooks/useAuth";

type Phase = "form" | "pin" | "success";

export default function SignUpPage() {
	const router = useRouter();
	const {theme, toggleTheme} = useTheme();
	const {isAuthenticated, loading} = useAuth();
	const [phase, setPhase] = useState<Phase>("form");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [pin, setPin] = useState(["", "", "", "", "", ""]);
	const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

	useEffect(() => {
		if (!loading && isAuthenticated) {
			router.push("/");
		}
	}, [loading, isAuthenticated, router]);

	if (loading) {
		return null; // Or a loading spinner
	}

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Mật khẩu xác nhận không khớp");
			return;
		}

		if (password.length < 6) {
			setError("Mật khẩu phải có ít nhất 6 ký tự");
			return;
		}

		setIsLoading(true);

		try {
			const data = await authService.registerSendPin({
				username,
				email,
				password,
			});

			if (data.success) {
				setPhase("pin");
			} else {
				setError(data.error || "Có lỗi xảy ra. Vui lòng thử lại.");
			}
		} catch {
			setError("Không thể kết nối đến server. Vui lòng thử lại.");
		} finally {
			setIsLoading(false);
		}
	};

	const handlePinChange = (index: number, value: string) => {
		if (value && !/^\d$/.test(value)) return;

		const newPin = [...pin];
		newPin[index] = value;
		setPin(newPin);

		if (value && index < 5) {
			pinInputRefs.current[index + 1]?.focus();
		}
	};

	const handlePinKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (e.key === "Backspace" && !pin[index] && index > 0) {
			pinInputRefs.current[index - 1]?.focus();
		}
	};

	const handlePinPaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		const pastedData = e.clipboardData
			.getData("text")
			.replace(/\D/g, "")
			.slice(0, 6);
		const newPin = [...pin];
		for (let i = 0; i < pastedData.length; i++) {
			newPin[i] = pastedData[i];
		}
		setPin(newPin);
		const focusIndex = Math.min(pastedData.length, 5);
		pinInputRefs.current[focusIndex]?.focus();
	};

	const handlePinSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		const pinCode = pin.join("");
		if (pinCode.length !== 6) {
			setError("Vui lòng nhập đủ 6 số");
			return;
		}

		setIsLoading(true);

		try {
			const data = await authService.registerVerifyPin({
				email,
				pin: pinCode,
			});

			if (data.success) {
				setPhase("success");
			} else {
				setError(data.error || "Mã PIN không đúng. Vui lòng thử lại.");
			}
		} catch {
			setError("Không thể kết nối đến server. Vui lòng thử lại.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendPin = async () => {
		setError("");
		setIsLoading(true);
		setPin(["", "", "", "", "", ""]);

		try {
			const data = await authService.registerSendPin({
				username,
				email,
				password,
			});

			if (!data.success) {
				setError(data.error || "Có lỗi xảy ra. Vui lòng thử lại.");
			}
		} catch {
			setError("Không thể kết nối đến server. Vui lòng thử lại.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col transition-colors duration-300'>
			<header className='flex items-center justify-between px-4 sm:px-10 py-4 sm:py-6'>
				{phase === "form" ?
					<button
						onClick={() => router.push("/")}
						className='flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer'
					>
						<ArrowLeft className='w-5 h-5' />
					</button>
				: phase === "pin" ?
					<button
						onClick={() => setPhase("form")}
						className='flex items-center gap-3 hover:opacity-80 transition-opacity'
					>
						<ArrowLeft className='w-5 h-5' />
					</button>
				:	<div />}
				<Button
					onClick={toggleTheme}
					className='!p-3 !bg-transparent !border-0 hover:!bg-black/5 dark:hover:!bg-white/10 !shadow-none'
				>
					{theme === "dark" ?
						<Sun className='w-5 h-5 text-black dark:text-white' />
					:	<Moon className='w-5 h-5 text-black dark:text-white' />}
				</Button>
			</header>

			<main className='flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8'>
				<AnimatePresence mode='wait'>
					{/* Phase 1: Registration Form */}
					{phase === "form" && (
						<motion.div
							key='form'
							initial={{opacity: 0, y: 20}}
							animate={{opacity: 1, y: 0}}
							exit={{opacity: 0, y: -20}}
							transition={{duration: 0.3}}
							className='w-full max-w-md'
						>
							<div className='w-full'>
								<h1 className='text-2xl sm:text-3xl font-bold text-center mb-2'>
									Đăng ký
								</h1>
								<p className='text-sm sm:text-base text-black/50 dark:text-white/50 text-center mb-6 sm:mb-8'>
									Tạo tài khoản mới
								</p>

								{error && (
									<div className='mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center'>
										{error}
									</div>
								)}

								<form
									onSubmit={handleFormSubmit}
									className='space-y-4'
								>
									<TextInput
										label='Username'
										icon={User}
										type='text'
										placeholder='Chữ cái, số và dấu gạch dưới...'
										value={username}
										onChange={(e) =>
											setUsername(
												e.target.value
													.toLowerCase()
													.replace(/[^a-z0-9_]/g, ""),
											)
										}
										required
										disabled={isLoading}
									/>

									<TextInput
										label='Email'
										icon={Mail}
										type='email'
										placeholder='Nhập email của bạn...'
										value={email}
										onChange={(e) =>
											setEmail(e.target.value)
										}
										required
										disabled={isLoading}
									/>

									<TextInput
										label='Mật khẩu'
										icon={Lock}
										type='password'
										placeholder='Nhập mật khẩu...'
										value={password}
										onChange={(e) =>
											setPassword(e.target.value)
										}
										required
										disabled={isLoading}
									/>

									<TextInput
										label='Xác nhận mật khẩu'
										icon={Lock}
										type='password'
										placeholder='Nhập lại mật khẩu...'
										value={confirmPassword}
										onChange={(e) =>
											setConfirmPassword(e.target.value)
										}
										required
										disabled={isLoading}
									/>

									<Button
										type='submit'
										className='w-full py-3 text-base font-medium mt-6'
										disabled={isLoading}
									>
										{isLoading ?
											<>
												<Loader2 className='w-5 h-5 mr-2 animate-spin' />
												Đang gửi...
											</>
										:	"Tiếp tục"}
									</Button>
								</form>

								<p className='text-center mt-6 text-black/50 dark:text-white/50'>
									Đã có tài khoản?{" "}
									<button
										onClick={() => router.push("/sign-in")}
										className='text-black dark:text-white font-medium hover:underline cursor-pointer'
									>
										Đăng nhập
									</button>
								</p>
							</div>
						</motion.div>
					)}

					{/* Phase 2: PIN Verification */}
					{phase === "pin" && (
						<motion.div
							key='pin'
							initial={{opacity: 0, y: 20}}
							animate={{opacity: 1, y: 0}}
							exit={{opacity: 0, y: -20}}
							transition={{duration: 0.3}}
							className='w-full max-w-md'
						>
							<div className='w-full text-center'>
								<div className='w-14 h-14 sm:w-16 sm:h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6'>
									<Mail className='w-7 h-7 sm:w-8 sm:h-8' />
								</div>
								<h1 className='text-2xl sm:text-3xl font-bold mb-2'>
									Xác thực email
								</h1>
								<p className='text-sm sm:text-base text-black/50 dark:text-white/50 mb-2'>
									Chúng tôi đã gửi mã PIN 6 số đến
								</p>
								<p className='font-medium mb-6 sm:mb-8 text-sm sm:text-base truncate'>
									{email}
								</p>

								{error && (
									<div className='mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm'>
										{error}
									</div>
								)}

								<form onSubmit={handlePinSubmit}>
									<div
										className='flex justify-center gap-1.5 sm:gap-2 mb-6'
										onPaste={handlePinPaste}
									>
										{pin.map((digit, index) => (
											<input
												key={index}
												ref={(el) => {
													pinInputRefs.current[
														index
													] = el;
												}}
												type='text'
												inputMode='numeric'
												maxLength={1}
												value={digit}
												onChange={(e) =>
													handlePinChange(
														index,
														e.target.value,
													)
												}
												onKeyDown={(e) =>
													handlePinKeyDown(index, e)
												}
												disabled={isLoading}
												className='w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg sm:rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors disabled:opacity-50'
											/>
										))}
									</div>

									<Button
										type='submit'
										className='w-full py-3 text-base font-medium'
										disabled={isLoading}
									>
										{isLoading ?
											<>
												<Loader2 className='w-5 h-5 mr-2 animate-spin' />
												Đang xác thực...
											</>
										:	"Xác thực"}
									</Button>
								</form>

								<p className='text-center mt-6 text-black/50 dark:text-white/50'>
									Không nhận được mã?{" "}
									<button
										onClick={handleResendPin}
										disabled={isLoading}
										className='text-black dark:text-white font-medium hover:underline disabled:opacity-50'
									>
										Gửi lại
									</button>
								</p>
							</div>
						</motion.div>
					)}

					{/* Phase 3: Success */}
					{phase === "success" && (
						<motion.div
							key='success'
							initial={{opacity: 0, scale: 0.95}}
							animate={{opacity: 1, scale: 1}}
							transition={{duration: 0.3}}
							className='w-full max-w-md text-center'
						>
							<div className='w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6'>
								<CheckCircle className='w-10 h-10 text-green-500' />
							</div>
							<h1 className='text-3xl font-bold mb-2'>
								Đăng ký thành công!
							</h1>
							<p className='text-black/50 dark:text-white/50 mb-8'>
								Tài khoản của bạn đã được tạo thành công.
								<br />
								Bây giờ bạn có thể đăng nhập để sử dụng dịch vụ.
							</p>
							<Button
								onClick={() => router.push("/sign-in")}
								className='px-8 py-3 text-base font-medium'
							>
								Đăng nhập ngay
							</Button>
						</motion.div>
					)}
				</AnimatePresence>
			</main>
		</div>
	);
}
