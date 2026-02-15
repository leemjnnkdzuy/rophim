import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import { Star, Film, Play } from "lucide-react";
import { Movie } from "@/app/types/movie";

interface MovieCardProps {
	movie: Movie;
	preferBackdrop?: boolean;
}

export function MovieCard({ movie, preferBackdrop = false }: MovieCardProps) {
	const router = useRouter();
	const [isHovered, setIsHovered] = useState(false);

	// Determine which image to show
	const imgSrc = preferBackdrop
		? (movie.backdrop || movie.poster || "")
		: (movie.poster || movie.backdrop || "");

	return (
		<div
			onClick={() => router.push(`/info/${movie.id}`)}
			className='group block cursor-pointer'
		>
			<div
				className='relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer'
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{/* Poster Placeholder */}
				{imgSrc ?
					<Image
						src={imgSrc}
						alt={movie.title}
						fill
						sizes='220px'
						unoptimized
						className='object-cover transition-transform duration-500 group-hover:scale-110'
					/>
					: <div className='absolute inset-0 bg-neutral-900 border border-white/10 flex items-center justify-center'>
						<div className='text-center p-3'>
							<Film className='h-10 w-10 text-[#8ae4ff]/30 mx-auto mb-2' />
							<p className='text-white/50 text-xs font-medium leading-tight'>
								{movie.title}
							</p>
						</div>
					</div>
				}

				<div className='absolute top-2 left-2 flex flex-col gap-1.5 z-10'>
					<Badge className='bg-[#8ae4ff]/90 text-black text-[10px] font-bold border-0 px-1.5 py-0.5 backdrop-blur-sm shadow-sm'>
						{movie.quality}
					</Badge>
					{movie.language &&
						movie.language.split(" + ").map((lang, idx) => (
							<Badge
								key={idx}
								className='bg-[#fbbf24] text-black text-[10px] font-bold border-0 px-1.5 py-0.5 backdrop-blur-sm shadow-sm'
							>
								{lang}
							</Badge>
						))}
				</div>

				{/* Rating */}
				{movie.rating > 0 && (
					<div className='absolute top-2 right-2 z-10'>
						<div className='flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5'>
							<Star className='h-3 w-3 text-primary fill-primary' />
							<span className='text-[11px] font-semibold text-primary'>
								{movie.rating}
							</span>
						</div>
					</div>
				)}

				{/* Episode Badge */}
				{movie.episode && (
					<div className='absolute bottom-2 right-2 z-10'>
						<Badge
							className={`${(
								movie.episode
									.toLowerCase()
									.includes("hoàn thành")
							) ?
								"bg-green-600 hover:bg-green-700 text-white border-green-500"
								: "bg-black/60 hover:bg-black/70 text-white border-white/20"
								} text-[10px] font-medium border px-2 py-0.5 backdrop-blur-md shadow-sm rounded-md transition-colors`}
						>
							{movie.episode}
						</Badge>
					</div>
				)}

				{/* Hover Overlay */}
				<div
					className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
						}`}
				>
					<div className='flex flex-col items-center gap-2'>
						{/* Custom Play Button Style if needed, or simple div */}
						<div className='w-12 h-12 rounded-full bg-[#8ae4ff]/90 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-[#8ae4ff]/30 transform transition-transform duration-300 group-hover:scale-110'>
							{/* Play icon inside */}
							<Play className="ml-0.5 fill-black text-black" size={20} />
						</div>
						<span className='text-xs text-white/80 font-medium'>
							Xem ngay
						</span>
					</div>
				</div>
			</div>

			{/* Info */}
			<div className='mt-2.5 px-0.5'>
				<h3 className='text-sm font-semibold text-white line-clamp-1 group-hover:text-[#8ae4ff] transition-colors'>
					{movie.title}
				</h3>
				<p className='text-xs text-gray-500 mt-0.5 line-clamp-1'>
					{movie.originalTitle} ({movie.year})
				</p>
			</div>
		</div>
	);
}
