"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { termsImage } from "@/app/assets";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useTheme } from "@/app/hooks/useTheme";

export default function TermsPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col transition-colors duration-300">
            {/* Header with Back and Theme buttons */}
            <header className="flex items-center justify-between px-4 sm:px-10 py-4 sm:py-6 relative z-50">
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <Button
                    onClick={toggleTheme}
                    className="!p-3 !bg-transparent !border-0 hover:!bg-black/5 dark:hover:!bg-white/10 !shadow-none text-black dark:text-white"
                >
                    {theme === "dark" ? (
                        <Sun className="w-6 h-6" />
                    ) : (
                        <Moon className="w-6 h-6" />
                    )}
                </Button>
            </header>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Left Side - Image */}
                    <div className="relative w-full aspect-square max-w-[500px] mx-auto lg:mx-0">
                        <Image
                            src={termsImage}
                            alt="Điều Khoản RapPhim"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Right Side - Content */}
                    <div className="space-y-6 text-center lg:text-left">
                        <h1 className="text-3xl lg:text-5xl font-bold text-black dark:text-white leading-tight">
                            Luật Chơi Của <br />
                            <span className="text-primary">Tụi Mình</span>
                        </h1>

                        <div className="space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                            <p>
                                Muốn chơi vui thì phải biết luật, đúng hông mấy fen? Đơn giản lắm, tụi anh không khó tính đâu.
                            </p>
                            <p>
                                Xem phim thoải mái, nhưng đừng có spam hay phá hoại web nha, tội nghiệp tụi anh lắm.
                                Bình luận văn minh, lịch sự, đừng spoil phim là được. Spoil là bị block ráng chịu à nha! 🚫
                            </p>
                            <p>
                                Tài khoản là của riêng mấy đứa, đừng share lung tung kẻo mất ráng chịu nha.
                                Tự bảo vệ "gia tài" phim ảnh của mình nhé.
                            </p>
                            <p className="italic text-black/80 dark:text-white/80 font-medium">
                                "Tôn trọng nhau một chút thì thế giới này đẹp biết bao nhiêu.
                                Chơi đẹp, sống chất, xem phim vui vẻ!"
                            </p>
                            <p className="font-bold text-primary text-xl">
                                Đã rõ luật chưa? Chiến thôi!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
