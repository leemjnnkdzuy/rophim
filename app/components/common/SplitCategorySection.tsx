import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Play, Star } from "lucide-react";
import { Movie } from "@/app/types/movie";
import { SectionTitle } from "./SectionTitle";

interface SplitCategorySectionProps {
    movies: Movie[];
    title: string;
    href?: string;
    icon?: React.ReactNode;
}

export function SplitCategorySection({ movies, title, href, icon }: SplitCategorySectionProps) {
    const router = useRouter();
    const [spotlightIdx, setSpotlightIdx] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (movies.length <= 1) return;
        const timer = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setSpotlightIdx((prev) => (prev + 1) % Math.min(movies.length, 10));
                setIsTransitioning(false);
            }, 300);
        }, 6000);
        return () => clearInterval(timer);
    }, [movies.length]);

    if (movies.length === 0) return null;
    const spotlight = movies[spotlightIdx];
    const listMovies = movies.slice(0, 10);

    return (
        <section className="w-full px-4 lg:px-32 py-10 font-sans">
            <SectionTitle
                title={title}
                icon={icon}
                href={href}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
                {/* Spotlight - Left */}
                <div className="relative rounded-2xl overflow-hidden bg-[#0f1014] aspect-[4/3] lg:aspect-auto lg:min-h-[520px] group cursor-pointer">
                    {/* Backdrop Image */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                    >
                        <img
                            src={spotlight?.backdrop || spotlight?.poster}
                            alt={spotlight?.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a12]/80 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a12]" />

                    {/* Content */}
                    <div
                        className={`absolute bottom-0 left-0 right-0 p-6 lg:p-8 z-10 transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
                    >
                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <Badge className="bg-primary text-black text-[10px] font-bold border-0 px-2 py-0.5 rounded-md">
                                {spotlight?.quality}
                            </Badge>
                            {spotlight?.rating > 0 && (
                                <Badge variant="outline" className="border-primary/40 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm">
                                    <Star className="h-3 w-3 mr-0.5 fill-primary" />
                                    {spotlight?.rating}
                                </Badge>
                            )}
                            <Badge variant="outline" className="border-white/20 text-gray-300 text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-sm">
                                {spotlight?.year}
                            </Badge>
                            {spotlight?.episode && (
                                <Badge className="bg-white/10 text-white text-[10px] font-medium border-0 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                    {spotlight?.episode}
                                </Badge>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-1.5">
                            {spotlight?.title}
                        </h3>
                        <p className="text-sm text-primary/70 font-medium mb-3">
                            {spotlight?.originalTitle}
                        </p>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {spotlight?.genre?.slice(0, 4).map((g) => (
                                <span
                                    key={g}
                                    className="text-[11px] text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5"
                                >
                                    {g}
                                </span>
                            ))}
                        </div>

                        {/* Description */}
                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-5 max-w-lg">
                            {spotlight?.description || "Mô tả phim chưa được cập nhật."}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => router.push(`/info/${spotlight?.id}`)}
                                className="bg-primary hover:bg-primary/90 text-black rounded-full px-6 font-semibold shadow-lg shadow-primary/20 h-10 text-sm cursor-pointer"
                            >
                                <Play className="h-4 w-4 mr-1.5" fill="black" />
                                Xem Ngay
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Movie List - Right */}
                <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[520px] pr-1 scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(138,228,255,0.2) transparent' }}>
                    {listMovies.map((movie, index) => (
                        <div
                            key={movie.id}
                            onClick={() => { setSpotlightIdx(index); }}
                            className={`
                                group/item flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 cursor-pointer
                                ${spotlightIdx === index
                                    ? 'bg-primary/10 border border-primary/20 shadow-md shadow-primary/5'
                                    : 'bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10'
                                }
                            `}
                        >
                            {/* Rank Number */}
                            <div className="flex-shrink-0 w-8 text-center">
                                <span className={`
                                    text-xl font-black 
                                    ${index < 3
                                        ? 'bg-gradient-to-b from-primary to-primary/50 bg-clip-text text-transparent'
                                        : 'text-white/15'
                                    }
                                `}>
                                    {index + 1}
                                </span>
                            </div>

                            {/* Poster */}
                            <div className="flex-shrink-0 w-14 h-20 rounded-lg overflow-hidden relative">
                                <img
                                    src={movie.backdrop}
                                    alt={movie.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute top-0.5 left-0.5">
                                    <span className="text-[8px] font-bold bg-primary/90 text-black px-1 py-0.5 rounded">
                                        {movie.quality}
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-semibold line-clamp-1 transition-colors duration-200 ${spotlightIdx === index ? 'text-primary' : 'text-white group-hover/item:text-primary'}`}>
                                    {movie.title}
                                </h4>
                                <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{movie.originalTitle}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] text-gray-500">{movie.year}</span>
                                    {movie.episode && (
                                        <>
                                            <span className="text-gray-700 text-[10px]">•</span>
                                            <span className="text-[10px] text-primary/70 font-medium">{movie.episode}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
