"use client";

import { useEffect } from "react";
import Image from "next/image";
import { icon, loadingBackground } from "@/app/assets";

export function LoadingScreen() {
	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, []);

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center overflow-hidden'>
			{/* Background Image with blur */}
			<div className='absolute inset-0'>
				<Image
					src={loadingBackground}
					alt='Loading background'
					fill
					className='object-cover scale-110 blur-sm'
					priority
					quality={75}
				/>
			</div>

			{/* Dark overlay with cinematic gradient */}
			<div className='absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90' />

			{/* Animated film grain texture overlay */}
			<div
				className='absolute inset-0 opacity-[0.03]'
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
				}}
			/>

			{/* Radial glow behind logo */}
			<div
				className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20'
				style={{
					background:
						"radial-gradient(circle, rgba(138,228,255,0.3) 0%, rgba(138,228,255,0.05) 40%, transparent 70%)",
					animation: "pulseGlow 3s ease-in-out infinite",
				}}
			/>

			{/* Main content */}
			<div className='relative z-10 flex flex-col items-center gap-8'>
				{/* Logo container with glow ring */}
				<div className='relative'>
					{/* Outer spinning ring */}
					<div
						className='absolute -inset-4 rounded-full'
						style={{
							background: `conic-gradient(from 0deg, transparent, #8ae4ff, transparent, transparent)`,
							animation: "spinSlow 2.5s linear infinite",
						}}
					/>
					{/* Inner ring background to mask the conic gradient */}
					<div className='absolute -inset-[14px] rounded-full bg-black/80 backdrop-blur-sm' />

					{/* Second spinning ring (opposite direction) */}
					<div
						className='absolute -inset-6 rounded-full opacity-40'
						style={{
							background: `conic-gradient(from 180deg, transparent, #8ae4ff40, transparent, transparent)`,
							animation: "spinSlow 4s linear infinite reverse",
						}}
					/>
					<div className='absolute -inset-[22px] rounded-full bg-black/60' />

					{/* Logo with glow */}
					<div
						className='relative w-24 h-24 rounded-2xl overflow-hidden shadow-2xl'
						style={{
							boxShadow: "0 0 40px rgba(138,228,255,0.3), 0 0 80px rgba(138,228,255,0.1)",
							animation: "logoPulse 2s ease-in-out infinite",
						}}
					>
						<Image
							src={icon}
							alt='RapPhim'
							fill
							sizes="96px"
							className='object-cover'
							priority
						/>
					</div>
				</div>

				{/* Brand name with shimmer effect */}
				<div className='flex flex-col items-center gap-2 mt-2'>
					<h1
						className='text-3xl font-bold tracking-wider'
						style={{
							background: "linear-gradient(90deg, #8ae4ff, #ffffff, #8ae4ff)",
							backgroundSize: "200% auto",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
							animation: "shimmer 2.5s linear infinite",
						}}
					>
						RapPhim
					</h1>
					<p className='text-white/40 text-sm tracking-[0.3em] uppercase'>
						Đang tải trải nghiệm điện ảnh
					</p>
				</div>

				{/* Five wave dots */}
				<div className='flex gap-3'>
					{[0, 1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className='w-2 h-2 rounded-full bg-primary'
							style={{
								animation: `dotWave 1.2s ease-in-out ${i * 0.15}s infinite`,
							}}
						/>
					))}
				</div>
			</div>

			{/* CSS Animations */}
			<style jsx>{`
				@keyframes spinSlow {
					from {
						transform: rotate(0deg);
					}
					to {
						transform: rotate(360deg);
					}
				}

				@keyframes pulseGlow {
					0%,
					100% {
						transform: translate(-50%, -50%) scale(1);
						opacity: 0.2;
					}
					50% {
						transform: translate(-50%, -50%) scale(1.1);
						opacity: 0.35;
					}
				}

				@keyframes logoPulse {
					0%,
					100% {
						box-shadow: 0 0 40px rgba(138, 228, 255, 0.3),
							0 0 80px rgba(138, 228, 255, 0.1);
					}
					50% {
						box-shadow: 0 0 60px rgba(138, 228, 255, 0.5),
							0 0 120px rgba(138, 228, 255, 0.2);
					}
				}

				@keyframes shimmer {
					to {
						background-position: 200% center;
					}
				}

				@keyframes dotWave {
					0%,
					100% {
						transform: translateY(0);
					}
					50% {
						transform: translateY(15px);
					}
				}
			`}</style>
		</div>
	);
}
