import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Play } from "lucide-react";
import { Movie } from "@/app/types/movie";
import { SectionTitle } from "./SectionTitle";

interface HeroCategorySectionProps {
    movies: Movie[];
    title?: string;
    href?: string;
    icon?: React.ReactNode;
}

export function HeroCategorySection({ movies, title, href, icon }: HeroCategorySectionProps) {
    const router = useRouter();
    const [activeMovie, setActiveMovie] = useState<Movie | null>(null);

    useEffect(() => {
        if (movies.length > 0) {
            setActiveMovie(movies[0]);
        }
    }, [movies]);

    if (!activeMovie) return null;

    return (
        <section className="w-full px-4 lg:px-32 py-10 font-sans">
            {title && <SectionTitle title={title} icon={icon} href={href} />}
            <div className="relative w-full aspect-[4/3] lg:aspect-[2.5/1] rounded-3xl overflow-hidden group shadow-2xl bg-[#0f1014]">
                {/* Background Image */}
                <div key={activeMovie.id} className="absolute inset-0 animate-in fade-in duration-700">
                    <img
                        src={activeMovie.poster}
                        alt={activeMovie.title}
                        className="w-full h-full object-cover opacity-60 ml-auto"
                        style={{ maskImage: "linear-gradient(to right, transparent 0%, black 100%)" }}
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0f1014] via-[#0f1014]/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1014] via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 p-6 lg:p-12 flex flex-col justify-start lg:justify-center max-w-2xl z-10">
                    <h2 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-2 font-display">
                        {activeMovie.title}
                    </h2>
                    <p className="text-lg text-gray-400 font-medium mb-4">{activeMovie.originalTitle}</p>

                    <div className="flex items-center gap-3 mb-6 flex-wrap">
                        {activeMovie.rating > 0 && (
                            <Badge className="bg-primary text-black hover:bg-primary/90 font-bold border-0 px-2 rounded-md">
                                IMDb {activeMovie.rating}
                            </Badge>
                        )}
                        <Badge variant="outline" className="border-white/30 text-white font-medium px-2 rounded-md">
                            {activeMovie.year}
                        </Badge>
                        <Badge variant="outline" className="border-white/30 text-white font-medium px-2 rounded-md">
                            {activeMovie.episode}
                        </Badge>
                        <Badge className="bg-white/10 text-white hover:bg-white/20 border-0 px-2 rounded-md">
                            {activeMovie.quality}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {activeMovie.genre?.slice(0, 3).map((g) => (
                            <Badge
                                key={g}
                                variant="secondary"
                                className="bg-white/10 text-gray-200 hover:bg-white/20 border-0 rounded-full px-4 py-1 text-xs font-medium backdrop-blur-md"
                            >
                                {g}
                            </Badge>
                        ))}
                    </div>

                    <p className="text-gray-300 text-sm lg:text-base leading-relaxed line-clamp-3 mb-8 max-w-xl">
                        {activeMovie.description || "Mô tả phim chưa được cập nhật. Hãy xem ngay để khám phá những tình tiết thú vị!"}
                    </p>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => router.push(`/info/${activeMovie.id}`)}
                            className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 text-black p-0 shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:scale-105 transition-transform cursor-pointer"
                        >
                            <Play fill="currentColor" className="w-6 h-6 ml-1" />
                        </Button>
                    </div>
                </div>

                {/* Thumbnails List */}
                <div
                    className="absolute bottom-6 right-6 left-6 lg:left-auto lg:w-1/2 flex items-end justify-start lg:justify-end gap-3 overflow-x-auto py-4 px-2 z-20"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style jsx>{`
                        div::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    {movies.slice(0, 8).map((movie) => (
                        <div
                            key={movie.id}
                            onClick={() => setActiveMovie(movie)}
                            className={`
                                relative flex-shrink-0 w-24 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                                ${activeMovie.id === movie.id ? 'ring-2 ring-primary scale-105 shadow-xl translate-y-0' : 'opacity-60 hover:opacity-100 hover:scale-105 translate-y-2 hover:translate-y-0'}
                            `}
                        >
                            <img
                                src={movie.poster}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            {activeMovie.id === movie.id && (
                                <div className="absolute inset-0 bg-black/10" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
