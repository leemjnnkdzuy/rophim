"use client";

import React, {useState} from "react";
import {AlertCircle, Loader2} from "lucide-react";
import {Button} from "@/app/components/ui/button";

interface ConfirmDeletePopupProps {
	isOpen: boolean;
	title?: string;
	message?: string;
	description?: string;
	destructiveText?: string;
	isLoading?: boolean;
	onConfirm: () => void | Promise<void>;
	onCancel: () => void;
}

export default function ConfirmDeletePopup({
	isOpen,
	title = "Xác nhận xóa",
	message = "Bạn chắc chắn muốn xóa không?",
	description,
	destructiveText = "Xóa",
	isLoading = false,
	onConfirm,
	onCancel,
}: ConfirmDeletePopupProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	if (!isOpen) return null;

	const handleConfirm = async () => {
		try {
			setIsDeleting(true);
			await onConfirm();
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center'>
			{/* Backdrop */}
			<div
				className='absolute inset-0 bg-black/60 backdrop-blur-sm'
				onClick={onCancel}
			/>

			{/* Modal */}
			<div className='relative bg-neutral-900 rounded-2xl border border-white/10 shadow-2xl shadow-black/40 max-w-sm w-full mx-4 overflow-hidden'>
				{/* Header */}
				<div className='px-6 py-5 border-b border-white/5 flex items-start gap-3'>
					<div className='w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5'>
						<AlertCircle className='h-5 w-5 text-red-400' />
					</div>
					<div className='flex-1 min-w-0'>
						<h2 className='text-lg font-bold text-white'>
							{title}
						</h2>
					</div>
				</div>

				{/* Content */}
				<div className='px-6 py-4 space-y-2'>
					<p className='text-sm text-gray-300 leading-relaxed'>
						{message}
					</p>
					{description && (
						<p className='text-xs text-gray-500 leading-relaxed'>
							{description}
						</p>
					)}
				</div>

				{/* Footer */}
				<div className='px-6 py-4 border-t border-white/5 flex items-center gap-3 justify-end'>
					<Button
						variant='ghost'
						size='sm'
						onClick={onCancel}
						disabled={isDeleting || isLoading}
						className='text-gray-400 hover:text-white hover:bg-white/10 h-9 px-4 rounded-lg transition-all cursor-pointer font-medium text-sm'
					>
						Hủy
					</Button>
					<Button
						size='sm'
						onClick={handleConfirm}
						disabled={isDeleting || isLoading}
						className='bg-red-600 hover:bg-red-700 text-white h-9 px-6 rounded-lg transition-all cursor-pointer font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed'
					>
						{isDeleting || isLoading ?
							<>
								<Loader2 className='h-3.5 w-3.5 animate-spin mr-1.5' />
								Đang xóa...
							</>
						:	destructiveText}
					</Button>
				</div>
			</div>
		</div>
	);
}
