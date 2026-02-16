"use client";

import React from "react";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {introductionImage} from "@/app/assets";
import {ArrowLeft, Moon, Sun} from "lucide-react";
import {Button} from "@/app/components/ui/button";
import {useTheme} from "@/app/hooks/useTheme";

export default function IntroductionPage() {
	const router = useRouter();
	const {theme, toggleTheme} = useTheme();

	return (
		<div className='min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col transition-colors duration-300'>
			{/* Header with Back and Theme buttons */}
			<header className='flex items-center justify-between px-4 sm:px-10 py-4 sm:py-6 relative z-50'>
				<button
					onClick={() => router.push("/")}
					className='flex items-center gap-3 hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer'
				>
					<ArrowLeft className='w-6 h-6' />
				</button>
				<Button
					onClick={toggleTheme}
					className='!p-3 !bg-transparent !border-0 hover:!bg-black/5 dark:hover:!bg-white/10 !shadow-none text-black dark:text-white'
				>
					{theme === "dark" ?
						<Sun className='w-6 h-6' />
					:	<Moon className='w-6 h-6' />}
				</Button>
			</header>

			<div className='flex-1 flex items-center justify-center p-4'>
				<div className='max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
					{/* Left Side - Image */}
					<div className='relative w-full aspect-square max-w-[500px] mx-auto lg:mx-0'>
						<Image
							src={introductionImage}
							alt='Abe Trà Cú Introduction'
							fill
							className='object-contain'
							priority
						/>
					</div>

					{/* Right Side - Content */}
					<div className='space-y-6 text-center lg:text-left'>
						<h1 className='text-3xl lg:text-5xl font-bold text-black dark:text-white leading-tight'>
							Hé Lô mấy đứa <br />
							<span className='text-primary'>Abe Trà Cú</span> tới
							đây !!!
						</h1>

						<div className='space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed'>
							<p>
								Chào mừng mấy đứa đã lạc trôi vào cái
								&quot;ổ&quot; phim ảnh của tụi anh!
							</p>
							<p>
								Nơi đây là thánh địa dành cho những tâm hồn đồng
								điệu, những người có thể ngồi cày phim xuyên màn
								đêm, mặc kệ deadline đang gào thét hay sếp đang
								réo gọi (đùa đấy, nhớ làm việc nha mấy fen).
							</p>
							<p>
								Từ bom tấn Hollywood cháy nổ đùng đùng 💥, drama
								Hàn Quốc khóc hết nước mắt 😭, cho đến Anime
								cute phô mai que 🧀 hay phim kinh dị làm bạn
								không dám đi vệ sinh ban đêm 👻. Tất cả đều được
								tuyển chọn và cập nhật bằng cả trái tim và đôi
								mắt thâm quầng của đội ngũ Abe Trà Cú.
							</p>
							<p className='italic text-black/80 dark:text-white/80 font-medium'>
								&quot;Mục tiêu của chúng mình không chỉ là web
								xem phim, mà là nơi để chúng ta cùng chill, cùng
								bàn luận và cùng nhau trốn khỏi thực tại phũ
								phàng (một chút thôi).&quot;
							</p>
							<p className='font-bold text-primary text-xl'>
								Chuẩn bị bắp nước và thưởng thức ngay nào! 🍿
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
