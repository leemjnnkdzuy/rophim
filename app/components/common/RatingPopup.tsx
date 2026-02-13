"use client";

import React, {useState, useEffect} from "react";
import {Button} from "@/app/components/ui/button";
import {Badge} from "@/app/components/ui/badge";
import {Star, X} from "lucide-react";
import {useGlobalNotificationPopup} from "@/app/hooks/useGlobalNotificationPopup";
import {useAuth} from "@/app/hooks/useAuth";

interface RatingPopupProps {
	filmSlug?: string;
	filmId?: string;
	onClose?: () => void;
	onRatingSubmit?: (rating: number) => void;
	currentRating?: number;
	averageRating?: number;
}

const RatingPopup: React.FC<RatingPopupProps> = ({
	filmSlug,
	filmId,
	onClose,
	onRatingSubmit,
	currentRating,
	averageRating,
}) => {
	const [rating, setRating] = useState<number>(currentRating || 0);
	const [hoverRating, setHoverRating] = useState<number>(0);
	const [isLoading, setIsLoading] = useState(false);
	const {showNotification} = useGlobalNotificationPopup();
	const {isAuthenticated} = useAuth();

	useEffect(() => {
		if (currentRating) {
			setRating(currentRating);
		}
	}, [currentRating]);

	const handleRatingClick = (value: number) => {
		setRating(value);
	};

	const handleSubmit = async () => {
		if (!isAuthenticated) {
			showNotification("Vui lòng đăng nhập để đánh giá", "error");
			return;
		}

		if (rating === 0) {
			showNotification("Vui lòng chọn số sao", "error");
			return;
		}

		setIsLoading(true);
		try {
			const slug = filmSlug || filmId;
			const response = await fetch(`/api/user/films/${slug}/rating`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({rating}),
			});

			if (!response.ok) {
				throw new Error("Failed to submit rating");
			}

			showNotification("Đánh giá phim thành công!", "success");
			onRatingSubmit?.(rating);
			onClose?.();
		} catch (error) {
			showNotification(
				"Lỗi khi lưu đánh giá. Vui lòng thử lại.",
				"error",
			);
			console.error("Rating submission error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
			<div className='bg-neutral-900 rounded-2xl border border-white/10 p-8 max-w-sm w-full shadow-2xl'>
				{/* Header */}
				<div className='flex items-center justify-between mb-6'>
					<div className='flex items-center gap-2'>
						<Star
							className='w-5 h-5 text-cyan-400'
							fill='currentColor'
						/>
						<h2 className='text-xl font-bold text-white'>
							Đánh giá phim
						</h2>
					</div>
					<button
						onClick={onClose}
						className='text-gray-400 hover:text-white transition-colors'
						aria-label='Close'
					>
						<X className='w-5 h-5' />
					</button>
				</div>

				{/* Current Rating Display */}
				{averageRating ?
					<div className='mb-6 p-4 bg-white/5 rounded-lg border border-white/10 text-center'>
						<p className='text-gray-400 text-sm mb-1'>
							Đánh giá trung bình
						</p>
						<div className='flex items-center justify-center gap-2'>
							<span className='text-3xl font-bold text-cyan-400'>
								{averageRating.toFixed(1)}
							</span>
							<Star
								className='w-6 h-6 text-cyan-400'
								fill='currentColor'
							/>
						</div>
					</div>
				:	null}

				{/* Star Rating */}
				<div className='mb-8'>
					<p className='text-gray-400 text-sm mb-4'>
						Đánh giá của bạn
					</p>
					<div className='flex justify-center gap-3'>
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
							<button
								key={star}
								onClick={() => handleRatingClick(star)}
								onMouseEnter={() => setHoverRating(star)}
								onMouseLeave={() => setHoverRating(0)}
								className='transition-all duration-200 hover:scale-110 focus:outline-none'
								disabled={isLoading}
							>
								<Star
									className={`w-8 h-8 transition-colors duration-200 ${
										star <= (hoverRating || rating) ?
											"text-cyan-400 drop-shadow-lg"
										:	"text-gray-600 hover:text-cyan-400/60"
									}`}
									fill={
										star <= (hoverRating || rating) ?
											"currentColor"
										:	"none"
									}
								/>
							</button>
						))}
					</div>
				</div>

				{/* Rating Badge */}
				{rating > 0 && (
					<div className='mb-6 text-center'>
						<Badge
							variant='secondary'
							className='bg-cyan-400/10 text-cyan-400 border border-cyan-400/30'
						>
							{rating} / 10 sao
						</Badge>
					</div>
				)}

				{/* Action Buttons */}
				<div className='flex gap-3'>
					<button
						onClick={onClose}
						className='flex-1 px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors disabled:opacity-50'
						disabled={isLoading}
					>
						Hủy
					</button>
					<Button
						onClick={handleSubmit}
						disabled={isLoading || rating === 0}
						className='flex-1 bg-cyan-400 hover:bg-cyan-500 text-black font-semibold rounded-lg transition-colors disabled:opacity-50'
					>
						{isLoading ? "Đang gửi..." : "Đánh giá"}
					</Button>
				</div>

				{/* Login Prompt */}
				{!isAuthenticated && (
					<p className='text-center text-gray-400 text-sm mt-4'>
						Vui lòng đăng nhập để đánh giá phim
					</p>
				)}
			</div>
		</div>
	);
};

export default RatingPopup;
