"use client";

import { useEffect } from "react";
import Image from "next/image";
import { icon } from "@/app/assets";

export function LoadingScreen() {
	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, []);

	return (
		<div className='fixed inset-0 z-50 bg-gradient-to-br from-neutral-950 to-neutral-900 flex items-center justify-center'>
			<div className='flex flex-col items-center gap-4'>
				{/* Spinning Loader */}
				<div className='relative w-20 h-20'>
					<div className='absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin' />
					<div className='absolute inset-0 flex items-center justify-center'>
						<Image
							src={icon}
							alt='RapPhim'
							width={48}
							height={48}
							className='rounded-lg'
						/>
					</div>
				</div>
				<p className='text-gray-400 text-sm'>Đang tải...</p>
			</div>
		</div>
	);
}
