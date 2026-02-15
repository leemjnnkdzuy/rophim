"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    Share2,
    Bookmark,
    Eye,
    EyeOff,
    Loader2,
    Calendar,
    User,
    ArrowLeft,
    Film,
    Camera,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { useAuth } from "@/app/hooks/useAuth";
import api from "@/app/utils/axios";
import { MovieCard } from "@/app/components/common/MovieCard";
import { Movie } from "@/app/types/movie";
import { AvatarCropDialog } from "@/app/components/common/AvatarCropDialog";

interface SavedFilm {
    slug: string;
    name: string;
    original_name?: string;
    poster_url?: string;
    thumb_url?: string;
    quality?: string;
    language?: string;
    years?: { id: string; name: string }[];
    formats?: { id: string; name: string }[];
    total_episodes?: number;
    current_episode?: string;
}

interface ProfileData {
    username: string;
    avatar: string;
    savedFilms: SavedFilm[];
    savedCount: number;
    showSavedFilms: boolean;
    isOwnProfile: boolean;
    createdAt: string;
}

export default function ProfilePage({ identifier }: { identifier?: string }) {
    const router = useRouter();
    const { user: authUser, isAuthenticated } = useAuth();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
    const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);

    const targetUsername = identifier || undefined;

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string> = {};
            if (targetUsername) {
                params.username = targetUsername;
            }
            const res = await api.get("/user/profile", { params });
            if (res.data?.success) {
                setProfile(res.data.profile);
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        } finally {
            setIsLoading(false);
        }
    }, [targetUsername]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const toggleShowSavedFilms = async (pressed: boolean) => {
        if (!profile || !profile.isOwnProfile) return;
        setIsTogglingVisibility(true);
        try {
            // pressed is the new state we want (true = show, false = hide)
            const res = await api.patch("/user/profile", {
                showSavedFilms: pressed,
            });
            if (res.data?.success) {
                setProfile((prev) =>
                    prev ? { ...prev, showSavedFilms: pressed } : prev,
                );
            }
        } catch (err) {
            console.error("Failed to toggle visibility:", err);
        } finally {
            setIsTogglingVisibility(false);
        }
    };

    const handleShareProfile = async () => {
        const username = profile?.username || authUser?.username;
        if (!username) return;
        const url = `${window.location.origin}/profile/${username}`;
        try {
            await navigator.clipboard.writeText(url);
            alert("Đã sao chép link hồ sơ!");
        } catch {
            // Fallback
            window.prompt("Sao chép link:", url);
        }
    };

    const handleAvatarSave = async (base64: string) => {
        const res = await api.patch("/user/profile", { avatar: base64 });
        if (res.data?.success && res.data.avatar !== undefined) {
            setProfile((prev) =>
                prev ? { ...prev, avatar: res.data.avatar } : prev,
            );
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatEpisode = (item: SavedFilm) => {
        if (
            item.formats?.some((f) => f.name === "Phim lẻ") ||
            item.total_episodes === 1
        )
            return "";

        const current = item.current_episode;
        const total = item.total_episodes;

        if (!current) return total ? `${total} Tập` : "";

        const currentLower = current.toLowerCase();
        if (
            currentLower.includes("full") ||
            currentLower.includes("hoàn tất")
        ) {
            return total ? `Hoàn Thành ${total} Tập` : "Hoàn Thành";
        }

        const num = parseInt(current.replace(/\D/g, ""));
        if (!isNaN(num) && total && total > 0) {
            return num >= total ?
                `Hoàn Thành ${total} Tập`
                : `Tập ${num}/${total}`;
        }
        return current;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#8ae4ff] animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <User className="w-16 h-16 text-gray-600" />
                <p className="text-gray-400 text-lg">Không tìm thấy hồ sơ</p>
                <Button
                    onClick={() => router.push("/")}
                    className="bg-[#8ae4ff] hover:bg-[#8ae4ff]/90 text-black rounded-full px-6 font-semibold"
                >
                    Về trang chủ
                </Button>
            </div>
        );
    }

    const isOwn = profile.isOwnProfile;

    return (
        <div className="min-h-screen bg-[#0a0a15]">
            {/* Banner / Cover */}
            <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                {/* Gradient banner */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 70%, #1a1a2e 100%)",
                    }}
                />
                {/* Noise overlay */}
                <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20" />
                {/* Rainbow accent */}
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        background:
                            "linear-gradient(120deg, transparent 20%, rgba(255,100,100,0.15) 30%, rgba(255,200,50,0.12) 40%, rgba(50,255,100,0.1) 50%, rgba(50,150,255,0.15) 60%, rgba(180,50,255,0.12) 70%, transparent 80%)",
                    }}
                />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a15] to-transparent" />

                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-all backdrop-blur-sm cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            {/* Profile Info */}
            <div className="relative px-4 lg:px-32 -mt-16 sm:-mt-20">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#0a0a15] overflow-hidden bg-[#161625] shadow-xl shadow-black/40">
                            {profile.avatar ? (
                                <Image
                                    src={profile.avatar}
                                    alt={profile.username}
                                    width={112}
                                    height={112}
                                    unoptimized
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#302b63] to-[#24243e]">
                                    <User className="w-10 h-10 text-gray-400" />
                                </div>
                            )}
                        </div>
                        {/* Camera overlay for owner */}
                        {isOwn && (
                            <button
                                onClick={() => setIsAvatarDialogOpen(true)}
                                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-all duration-200 cursor-pointer"
                                title="Thay đổi ảnh đại diện"
                            >
                                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg" />
                            </button>
                        )}
                    </div>

                    {/* Name & Actions */}
                    <div className="flex-1 min-w-0 sm:pt-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                                    {profile.username}
                                </h1>
                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                        Tham gia{" "}
                                        {formatDate(profile.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleShareProfile}
                                    variant="outline"
                                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs rounded-full px-4 h-8 gap-1.5 cursor-pointer"
                                >
                                    <Share2 className="w-3.5 h-3.5" />
                                    Chia sẻ hồ sơ
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-4 lg:px-32 mt-10 pb-16">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#8ae4ff] rounded-full" />
                        <h2 className="text-lg font-bold text-white">
                            Nhật ký tâm hồn
                        </h2>
                        <Badge className="bg-white/5 text-gray-400 border-white/10 text-xs">
                            {profile.savedCount} phim
                        </Badge>
                    </div>

                    {/* Toggle Visibility (own profile only) */}
                    {isOwn && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-300">
                                {profile.showSavedFilms
                                    ? "Công khai"
                                    : "Riêng tư"}
                            </span>
                            <Switch
                                checked={profile.showSavedFilms}
                                onCheckedChange={toggleShowSavedFilms}
                                disabled={isTogglingVisibility}
                                className="data-[state=checked]:bg-[#8ae4ff]"
                            />
                        </div>
                    )}
                </div>

                {/* Saved Films Grid */}
                {!isOwn && !profile.showSavedFilms ? (
                    /* Other user has hidden their saved films */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <EyeOff className="w-7 h-7 text-gray-600" />
                        </div>
                        <p className="text-gray-400 font-medium">
                            Nội dung này đã bị ẩn
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                            Người dùng đã chọn ẩn danh sách phim đã lưu
                        </p>
                    </div>
                ) : profile.savedFilms.length === 0 ? (
                    /* No saved films */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Bookmark className="w-7 h-7 text-gray-600" />
                        </div>
                        <p className="text-gray-400 font-medium">
                            {isOwn
                                ? "Chưa có phim nào được lưu"
                                : "Chưa có phim nào"}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                            {isOwn
                                ? "Phim bạn lưu sẽ xuất hiện tại đây."
                                : "Người dùng chưa lưu phim nào."}
                        </p>
                        {isOwn && (
                            <Button
                                onClick={() => router.push("/")}
                                className="mt-4 bg-[#8ae4ff] hover:bg-[#8ae4ff]/90 text-black rounded-full px-6 font-semibold text-sm cursor-pointer"
                            >
                                Khám phá phim
                            </Button>
                        )}
                    </div>
                ) : (
                    /* Saved films grid */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                        {profile.savedFilms.map((film) => {
                            const movieData: Movie = {
                                id: film.slug,
                                title: film.name,
                                originalTitle: film.original_name || film.name,
                                year: parseInt(film.years?.[0]?.name || "0"),
                                rating: 0,
                                quality: film.quality || "HD",
                                episode: formatEpisode(film),
                                poster:
                                    film.thumb_url || film.poster_url || "",
                                genre: [],
                                duration: "",
                                views: "",
                                language: film.language || "",
                                backdrop:
                                    film.poster_url || film.thumb_url || "",
                            };

                            return (
                                <MovieCard
                                    key={film.slug}
                                    movie={movieData}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Avatar Crop Dialog */}
            <AvatarCropDialog
                isOpen={isAvatarDialogOpen}
                onClose={() => setIsAvatarDialogOpen(false)}
                onSave={handleAvatarSave}
                currentAvatar={profile.avatar}
            />
        </div>
    );
}
