"use client";

import { useState, useEffect } from "react";
import {
	User,
	Lock,
	Eye,
	EyeOff,
	ArrowLeft,
	Loader2,
	Moon,
	Sun,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/app/components/ui/button";
import { TextInput } from "@/app/components/ui/TextInput";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { useGlobalNotificationPopup } from "@/app/hooks/useGlobalNotificationPopup";

export default function SignInPage() {
	const router = useRouter();
	const { theme, toggleTheme } = useTheme();
	const { login, isAuthenticated, loading } = useAuth();
	const { showNotification } = useGlobalNotificationPopup();

	const [showPassword, setShowPassword] = useState(false);
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!loading && isAuthenticated) {
			router.push("/");
		}
	}, [loading, isAuthenticated, router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const result = await login(identifier, password, rememberMe);

			if (result.success) {
				router.push("/");
			} else {
				showNotification(
					result.message || "Đăng nhập thất bại",
					"error",
				);
			}
		} catch {
			showNotification(
				"Không thể kết nối đến server. Vui lòng thử lại.",
				"error",
			);
		} finally {
			setIsLoading(false);
		}
	};

	if (loading) {
		return null; // Or a loading spinner
	}

	return (
		<div className='min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col transition-colors duration-300'>
			<header className='flex items-center justify-between px-4 sm:px-10 py-4 sm:py-6'>
				<Link
					href='/'
					className='flex items-center gap-3 hover:opacity-80 transition-opacity'
				>
					<ArrowLeft className='w-5 h-5' />
				</Link>
				<Button
					onClick={toggleTheme}
					className='!p-3 !bg-transparent !border-0 hover:!bg-black/5 dark:hover:!bg-white/10 !shadow-none'
				>
					{theme === "dark" ?
						<Sun className='w-5 h-5 text-black dark:text-white' />
						: <Moon className='w-5 h-5 text-black dark:text-white' />}
				</Button>
			</header>

			<main className='flex-1 flex items-center justify-center px-4 sm:px-6'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className='w-full max-w-md'
				>
					<div className='w-full'>
						<h1 className='text-2xl sm:text-3xl font-bold text-center mb-2'>
							Đăng nhập
						</h1>
						<p className='text-sm sm:text-base text-black/50 dark:text-white/50 text-center mb-6 sm:mb-8'>
							Chào mừng bạn quay trở lại
						</p>

						<form onSubmit={handleSubmit} className='space-y-4'>
							<TextInput
								label='Email hoặc Username'
								icon={User}
								type='text'
								placeholder='Nhập email hoặc username...'
								value={identifier}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) => setIdentifier(e.target.value)}
								required
								disabled={isLoading}
							/>

							<TextInput
								label='Mật khẩu'
								icon={Lock}
								type={showPassword ? "text" : "password"}
								placeholder='Nhập mật khẩu...'
								value={password}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) => setPassword(e.target.value)}
								required
								disabled={isLoading}
								rightElement={
									<button
										type='button'
										onClick={() =>
											setShowPassword(!showPassword)
										}
									>
										{showPassword ?
											<EyeOff className='w-5 h-5' />
											: <Eye className='w-5 h-5' />}
									</button>
								}
							/>

							<div className='flex items-center justify-between'>
								<label className='flex items-center gap-2 cursor-pointer select-none'>
									<div className='relative'>
										<input
											type='checkbox'
											checked={rememberMe}
											onChange={(e) =>
												setRememberMe(e.target.checked)
											}
											disabled={isLoading}
											className='sr-only peer'
										/>
										<div className='w-5 h-5 border-2 border-black/20 dark:border-white/20 rounded-md peer-checked:bg-black dark:peer-checked:bg-white peer-checked:border-black dark:peer-checked:border-white transition-all' />
										<svg
											className='absolute top-0.5 left-0.5 w-4 h-4 text-white dark:text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'
											strokeWidth={3}
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												d='M5 13l4 4L19 7'
											/>
										</svg>
									</div>
									<span className='text-sm text-black/60 dark:text-white/60'>
										Lưu đăng nhập
									</span>
								</label>
								<Link
									href='/forget-password'
									className='text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors'
								>
									Quên mật khẩu?
								</Link>
							</div>

							<Button
								type='submit'
								className='w-full py-3 text-base font-medium mt-6'
								disabled={isLoading}
							>
								{isLoading ?
									<>
										<Loader2 className='w-5 h-5 mr-2 animate-spin' />
										Đang đăng nhập...
									</>
									: "Đăng nhập"}
							</Button>
						</form>

						<p className='text-center mt-6 text-black/50 dark:text-white/50'>
							Chưa có tài khoản?{" "}
							<Link
								href='/sign-up'
								className='text-black dark:text-white font-medium hover:underline'
							>
								Đăng ký ngay
							</Link>
						</p>
					</div>
				</motion.div>
			</main>
		</div>
	);
}
