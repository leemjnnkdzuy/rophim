"use client";

import Link from "next/link";
import Image from "next/image";
import {Home, ArrowLeft} from "lucide-react";
import {Button} from "@/app/components/ui/button";
import {trongDong, icon} from "@/app/assets";

export default function NotFound() {
	return (
		<div className='min-h-screen bg-black text-white overflow-hidden relative flex items-center'>
			{/* Right Side - Rotating Trống Đồng Background (50% visible - left half) */}
			<div
				className='absolute right-1/8 top-1/2 w-[120%] h-[120%] opacity-[0.15] pointer-events-none animate-spin-slow'
				style={{transformOrigin: "center"}}
			>
				<Image
					src={trongDong}
					alt='Decoration'
					fill
					className='object-contain'
					style={{
						filter: "brightness(0.9) saturate(1.5) hue-rotate(180deg) contrast(1.1) drop-shadow(0 0 25px rgba(138, 228, 255, 0.6))",
					}}
				/>
			</div>

			{/* Left Side - Content */}
			<div className='relative z-10 px-6 lg:px-20 xl:px-32 py-16 max-w-5xl'>
				{/* Logo */}
				<div className='mb-8 flex items-center gap-3'>
					<div className='w-14 h-14 relative overflow-hidden'>
						<Image
							src={icon}
							alt='Logo'
							fill
							className='object-contain'
						/>
					</div>
					<span className='text-2xl font-bold'>RapPhim</span>
				</div>

				{/* Title */}
				<h1 className='text-7xl lg:text-5xl font-black mb-4 leading-none'>
					Không tày rồi !!
				</h1>

				{/* Subtitle */}
				<p className='text-gray-400 text-xl lg:text-2xl mb-10 leading-relaxed max-w-xl'>
					Trang bạn đang tìm kiếm chùng mình không tìm thấy.
					Bạn có thể đã nhập sai địa chỉ hoặc trang đã bị xóa. Đừng lo, hãy quay lại trang chủ và tiếp tục khám phá thế giới phim ảnh của chúng mình nhé!
				</p>

				{/* Action Buttons */}
				<div className='flex flex-col sm:flex-row gap-4'>
					<Button
						asChild
						className='flex-1 bg-white hover:bg-gray-100 text-black rounded-lg px-8 font-semibold h-12 text-base shadow-lg transition-all duration-300'
					>
						<Link
							href='/'
							className='flex items-center justify-center gap-2'
						>
							<Home className='h-5 w-5' />
							Về Trang Chủ
						</Link>
					</Button>

					<Button
						asChild
						variant='outline'
						className='flex-1 border-white/30 bg-transparent hover:bg-white/10 text-white rounded-lg px-8 font-semibold h-12 text-base'
					>
						<button
							onClick={() => window.history.back()}
							className='flex items-center justify-center gap-2 w-full'
						>
							<ArrowLeft className='h-5 w-5' />
							Quay Lại
						</button>
					</Button>
				</div>
			</div>

			{/* CSS for slow rotation */}
			<style jsx global>{`
				@keyframes spin-slow {
					from {
						transform: translate(50%, -50%) rotate(0deg);
					}
					to {
						transform: translate(50%, -50%) rotate(360deg);
					}
				}
				.animate-spin-slow {
					animation: spin-slow 20s linear infinite;
				}
			`}</style>
		</div>
	);
}
