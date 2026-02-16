"use client";

import React, {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {Bookmark, Film, Loader2} from "lucide-react";
import {SectionTitle} from "@/app/components/common/SectionTitle";
import {MovieCard} from "@/app/components/common/MovieCard";
import {Button} from "@/app/components/ui/button";
import {useAuth} from "@/app/hooks/useAuth";
import {Movie} from "@/app/types/movie";
import {mapFilmToMovie, ApiMovieItem} from "@/app/utils/movieMapper";
import {getUserSavedFilms} from "@/app/services/UserService";

export default function SavedPage() {
	const router = useRouter();
	const {isAuthenticated, loading} = useAuth();
	const [isFetching, setIsFetching] = useState(true);
	const [savedFilms, setSavedFilms] = useState<ApiMovieItem[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchSaved = async () => {
			if (loading) return;
			if (!isAuthenticated) {
				setIsFetching(false);
				return;
			}

			try {
				setIsFetching(true);
				const films = await getUserSavedFilms();
				setSavedFilms(films as unknown as ApiMovieItem[]);
				setError(null);
			} catch {
				setError("Không thể tải danh sách phim đã lưu.");
			} finally {
				setIsFetching(false);
			}
		};

		fetchSaved();
	}, [isAuthenticated, loading]);

	const movies: Movie[] = useMemo(() => {
		return savedFilms.map((film, index) => mapFilmToMovie(film, index));
	}, [savedFilms]);

	if (loading || isFetching) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<Loader2 className='h-10 w-10 text-primary animate-spin' />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className='min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center'>
				<div className='w-20 h-20 rounded-full bg-white/5 flex items-center justify-center'>
					<Bookmark className='h-10 w-10 text-primary/80' />
				</div>
				<h2 className='text-xl font-bold text-white'>
					Đăng nhập để xem phim đã lưu
				</h2>
				<p className='text-sm text-gray-400 max-w-md'>
					Bạn cần đăng nhập để lưu phim và xem lại danh sách yêu
					thích.
				</p>
				<Button
					className='bg-primary hover:bg-primary/90 text-black rounded-full px-6 font-semibold'
					onClick={() => router.push("/sign-in")}
				>
					Đăng nhập
				</Button>
			</div>
		);
	}

	return (
		<section className='w-full px-4 lg:px-32 py-10'>
			<SectionTitle
				title='Phim đã lưu'
				icon={<Bookmark className='h-5 w-5' />}
			/>

			{error ?
				<div className='flex flex-col items-center justify-center gap-3 py-12'>
					<p className='text-gray-400 text-sm'>{error}</p>
					<Button
						variant='outline'
						className='border-white/10 text-gray-300 hover:bg-white/10'
						onClick={() => window.location.reload()}
					>
						Thử lại
					</Button>
				</div>
			: movies.length === 0 ?
				<div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
					<div className='w-16 h-16 rounded-full bg-white/5 flex items-center justify-center'>
						<Film className='h-8 w-8 text-white/30' />
					</div>
					<h3 className='text-lg font-semibold text-white'>
						Chưa có phim đã lưu
					</h3>
					<p className='text-sm text-gray-400'>
						Lưu phim để xem lại sau.
					</p>
					<Button
						variant='outline'
						className='border-white/10 text-gray-300 hover:bg-white/10'
						onClick={() => router.push("/")}
					>
						Khám phá phim mới
					</Button>
				</div>
			:	<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5'>
					{movies.map((movie) => (
						<MovieCard
							key={movie.id}
							movie={movie}
							preferBackdrop
						/>
					))}
				</div>
			}
		</section>
	);
}
