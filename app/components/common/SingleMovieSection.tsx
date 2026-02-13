import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Play, Info, Star, Clock, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/app/types/movie";
import { SectionTitle } from "./SectionTitle";

export function SingleMovieSection({ movies }: { movies: Movie[] }) {
    const router = useRouter();
    const [activeIdx, setActiveIdx] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (movies.length <= 1) return;
        const timer = setInterval(() => {
            setActiveIdx((prev) => (prev + 1) % Math.min(movies.length, 12));
        }, 7000);
        return () => clearInterval(timer);
    }, [movies.length]);

    if (movies.length === 0) return null;
    const active = movies[activeIdx];
    const otherMovies = movies.filter((_, i) => i !== activeIdx).slice(0, 11);

    const scrollList = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
        }
    };

    return (
        <section className="w-full px-4 lg:px-32 py-10 font-sans">
            <SectionTitle
                title="Phim Lẻ Mới"
                icon={<Zap className="h-5 w-5" />}
                href="/danh-sach/phim-le"
            />

            {/* Featured Card */}
            <div
                key={active?.id}
                className="relative rounded-2xl overflow-hidden mb-6 group animate-in fade-in duration-500"
            >
                {/* Background */}
                <div className="absolute inset-0">
                    <img
                        src={active?.poster}
                        alt=""
                        className="w-full h-full object-cover object-center blur-sm scale-105"
                    />
                    <div className="absolute inset-0 bg-black/70" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative flex flex-col md:flex-row gap-5 md:gap-8 p-5 md:p-8">
                    {/* Poster */}
                    <div
                        onClick={() => router.push(`/info/${active?.id}`)}
                        className="flex-shrink-0 mx-auto md:mx-0 cursor-pointer"
                    >
                        <div className="relative w-[160px] md:w-[200px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 group-hover:ring-primary/30 transition-all duration-300">
                            <img
                                src={active?.backdrop}
                                alt={active?.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                <Badge className="bg-primary text-black text-[10px] font-bold border-0 px-1.5 py-0.5 shadow-sm">
                                    {active?.quality}
                                </Badge>
                            </div>
                            {/* Hover play */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                    <Play className="h-5 w-5 text-black ml-0.5" fill="black" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-center min-w-0 text-center md:text-left">
                        <div className="flex items-center gap-2 mb-3 flex-wrap justify-center md:justify-start">
                            {active?.rating > 0 && (
                                <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-full">
                                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                    <span className="text-xs font-bold text-amber-400">{active?.rating}</span>
                                </div>
                            )}
                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{active?.year}</span>
                            {active?.duration && active.duration !== "N/A" && (
                                <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {active?.duration}
                                </span>
                            )}
                            {active?.language && (
                                <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{active?.language}</span>
                            )}
                        </div>

                        <h3 className="text-2xl lg:text-3xl font-black text-white leading-tight mb-1">
                            {active?.title}
                        </h3>
                        <p className="text-sm text-white/35 font-medium mb-3">{active?.originalTitle}</p>

                        <div className="flex flex-wrap gap-1.5 mb-3 justify-center md:justify-start">
                            {active?.genre?.slice(0, 4).map((g) => (
                                <span key={g} className="text-[11px] text-gray-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                                    {g}
                                </span>
                            ))}
                        </div>

                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4 max-w-xl mx-auto md:mx-0">
                            {active?.description || "Một bộ phim hấp dẫn đang chờ bạn khám phá."}
                        </p>

                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <Button
                                onClick={() => router.push(`/info/${active?.id}`)}
                                className="bg-primary hover:bg-primary/90 text-black rounded-full px-6 font-bold shadow-lg shadow-primary/20 h-10 text-sm cursor-pointer"
                            >
                                <Play className="h-4 w-4 mr-1.5" fill="black" />
                                Xem Phim
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/info/${active?.id}`)}
                                className="border-white/15 text-white hover:bg-white/10 rounded-full px-5 font-medium h-10 text-sm cursor-pointer backdrop-blur-sm"
                            >
                                <Info className="h-4 w-4 mr-1.5" />
                                Chi Tiết
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Horizontal Movie List */}
            <div className="relative group/scroll">
                {/* Scroll Buttons */}
                <button
                    onClick={() => scrollList('left')}
                    className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-primary hover:text-black text-white p-2.5 rounded-full backdrop-blur-sm opacity-0 group-hover/scroll:opacity-100 transition-all duration-300 -ml-3 shadow-xl border border-white/10"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                    onClick={() => scrollList('right')}
                    className="cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-primary hover:text-black text-white p-2.5 rounded-full backdrop-blur-sm opacity-0 group-hover/scroll:opacity-100 transition-all duration-300 -mr-3 shadow-xl border border-white/10"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth py-2 select-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
                    {otherMovies.map((movie, index) => (
                        <div
                            key={movie.id}
                            onClick={() => setActiveIdx(movies.findIndex(m => m.id === movie.id))}
                            className="flex-shrink-0 w-[140px] lg:w-[160px] cursor-pointer group/card"
                        >
                            <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2 ring-1 ring-white/5 group-hover/card:ring-primary/30 transition-all duration-300">
                                <img
                                    src={movie.backdrop}
                                    alt={movie.title}
                                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />
                                <div className="absolute top-1.5 left-1.5">
                                    <Badge className="bg-primary/90 text-black text-[9px] font-bold border-0 px-1.5 py-0.5">
                                        {movie.quality}
                                    </Badge>
                                </div>
                                {movie.rating > 0 && (
                                    <div className="absolute top-1.5 right-1.5">
                                        <div className="flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded px-1 py-0.5">
                                            <Star className="h-2.5 w-2.5 text-primary fill-primary" />
                                            <span className="text-[9px] font-semibold text-primary">{movie.rating}</span>
                                        </div>
                                    </div>
                                )}
                                {/* Hover play overlay */}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                                    <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
                                        <Play className="h-4 w-4 text-black ml-0.5" fill="black" />
                                    </div>
                                </div>
                            </div>
                            <h4 className="text-xs font-semibold text-white line-clamp-1 group-hover/card:text-primary transition-colors">{movie.title}</h4>
                            <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{movie.originalTitle}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
