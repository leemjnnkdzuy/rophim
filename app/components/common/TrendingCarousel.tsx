"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import { Play, Eye } from "lucide-react";
import { Movie } from "@/app/types/movie";

interface TrendingCarouselProps {
    movies: Movie[];
    title: string;
    description: string;
}

export function TrendingCarousel({ movies, title, description }: TrendingCarouselProps) {
    const router = useRouter();

    if (movies.length === 0) return null;

    return (
        <section className="w-full py-10 relative">
            {/* Background glow */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[400px] bg-orange-500/8 blur-[150px] rounded-full" />
                <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[300px] bg-primary/6 blur-[120px] rounded-full" />
            </div>

            <div className="relative px-4 lg:px-32">
                <div className="flex items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {title}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Full-width grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-2 lg:gap-x-3 gap-y-4">
                    {movies.map((movie, index) => (
                        <div
                            key={movie.id}
                            onClick={() => router.push(`/info/${movie.id}`)}
                            className="flex items-end gap-0 group cursor-pointer"
                        >
                            {/* Rank Number */}
                            <span
                                className="text-[80px] lg:text-[100px] font-black leading-none select-none flex-shrink-0"
                                style={
                                    index === 0
                                        ? {
                                            WebkitTextStroke: "2px #FFD700",
                                            color: "transparent",
                                            WebkitTextFillColor: "transparent",
                                            marginRight: "-16px",
                                            zIndex: 1,
                                            filter: "drop-shadow(2px 4px 6px rgba(255, 215, 0, 7))",
                                        }
                                        : index === 1
                                            ? {
                                                WebkitTextStroke: "2px #00FFFF",
                                                color: "transparent",
                                                WebkitTextFillColor: "transparent",
                                                marginRight: "-16px",
                                                zIndex: 1,
                                                filter: "drop-shadow(2px 4px 6px rgba(0, 255, 255, 7))",
                                            }
                                            : index === 2
                                                ? {
                                                    WebkitTextStroke: "2px #FF7F50",
                                                    color: "transparent",
                                                    WebkitTextFillColor: "transparent",
                                                    marginRight: "-16px",
                                                    zIndex: 1,
                                                    filter: "drop-shadow(2px 4px 6px rgba(255, 69, 0, 7))",
                                                }
                                                : {
                                                    WebkitTextStroke: "2px rgba(255,255,255,0.15)",
                                                    color: "transparent",
                                                    marginRight: "-16px",
                                                    zIndex: 1,
                                                }
                                }
                            >
                                {index + 1}
                            </span>

                            {/* Card */}
                            <div className="relative flex-1 aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-orange-400/40 transition-all duration-300 shadow-xl z-10">
                                <Image
                                    src={movie.backdrop || movie.poster || ""}
                                    alt={movie.title}
                                    fill
                                    unoptimized
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                {/* Quality badge */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1">
                                    <Badge className="bg-orange-500/90 text-white text-[9px] font-bold border-0 px-1.5 py-0.5">
                                        {movie.quality}
                                    </Badge>
                                </div>

                                {/* Episode Badge */}
                                {movie.episode && (
                                    <div className="absolute bottom-10 left-2 z-10">
                                        <Badge
                                            className={`${movie.episode.toLowerCase().includes("hoàn thành")
                                                ? "bg-green-600 hover:bg-green-700 text-white border-green-500"
                                                : "bg-black/60 hover:bg-black/70 text-white border-white/20"
                                                } text-[9px] font-medium border px-1.5 py-0 shadow-sm rounded transition-colors`}
                                        >
                                            {movie.episode}
                                        </Badge>
                                    </div>
                                )}

                                {/* Views */}
                                <div className="absolute bottom-2 left-2 right-2">
                                    <p className="text-[11px] text-white font-semibold line-clamp-1">
                                        {movie.title}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Eye className="h-3 w-3 text-orange-300" />
                                        <span className="text-[10px] text-orange-300/80">
                                            {movie.views} lượt xem
                                        </span>
                                    </div>
                                </div>

                                {/* Hover play */}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-11 h-11 rounded-full bg-orange-500/90 flex items-center justify-center shadow-lg shadow-orange-500/30">
                                        <Play
                                            className="h-5 w-5 text-white ml-0.5"
                                            fill="white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
