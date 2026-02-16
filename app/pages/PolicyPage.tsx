"use client";

import React from "react";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {policyImage} from "@/app/assets";
import {ArrowLeft, Moon, Sun} from "lucide-react";
import {Button} from "@/app/components/ui/button";
import {useTheme} from "@/app/hooks/useTheme";

export default function PolicyPage() {
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
							src={policyImage}
							alt='Chính Sách Bảo Mật RapPhim'
							fill
							className='object-contain'
							priority
						/>
					</div>

					{/* Right Side - Content */}
					<div className='space-y-6 text-center lg:text-left'>
						<h1 className='text-3xl lg:text-5xl font-bold text-black dark:text-white leading-tight'>
							Bí Mật Của <br />
							<span className='text-primary'>Tụi Mình</span>
						</h1>

						<div className='space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed'>
							<p>
								Mấy đứa yên tâm, thông tin của mấy đứa ở đây an
								toàn hơn cả bí mật crush của mấy đứa nữa!
							</p>
							<p>
								Tụi anh cam kết không bán thông tin cho ai đâu,
								trừ khi... đùa thôi, không bao giờ nhé! Dữ liệu
								của mấy đứa chỉ để phục vụ cho việc trải nghiệm
								xem phim xịn xò hơn thôi.
							</p>
							<p>
								Cookie các thứ là để giúp mấy đứa xem phim mượt
								hơn, nhớ được tập phim đang xem dở, chứ không
								phải để theo dõi mấy đứa ăn gì đâu nhen 🍪.
							</p>
							<p className='italic text-black/80 dark:text-white/80 font-medium'>
								&quot;Tin tưởng nhau là chính, nhưng mà tụi anh
								cũng trang bị đủ thứ để bảo vệ thông tin cho mấy
								đứa rồi. Cứ yên tâm mà tận hưởng phim nhé!&quot;
							</p>
							<p className='font-bold text-primary text-xl'>
								An toàn là trên hết, chill thôi nào!
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
