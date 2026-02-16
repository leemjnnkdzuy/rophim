"use client";

import React, {useEffect, useMemo, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {Film, Loader2, Search} from "lucide-react";
import {SectionTitle} from "@/app/components/common/SectionTitle";
import {MovieCard} from "@/app/components/common/MovieCard";
import {Button} from "@/app/components/ui/button";
import {Input} from "@/app/components/ui/input";
import api from "@/app/utils/axios";
import {Movie} from "@/app/types/movie";
import {mapFilmToMovie, ApiMovieItem} from "@/app/utils/movieMapper";

interface CategoryPageProps {
	plotId?: string;
	identifier?: string;
	episodeSlug?: string;
	id?: string;
}

export default function CategoryPage(props: CategoryPageProps) {
	const params = useParams();
	const router = useRouter();
	const categoryId = (props.id || params.id) as string;

	const [categoryTitle, setCategoryTitle] = useState<string>("");
	const [films, setFilms] = useState<ApiMovieItem[]>([]);
	const [isFetching, setIsFetching] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	// Fetch category data
	useEffect(() => {
		const fetchCategory = async () => {
			if (!categoryId) {
				setError("Danh mục không tồn tại");
				setIsFetching(false);
				return;
			}

			try {
				setIsFetching(true);
				const res = await api.get(`/categories/${categoryId}`);
				if (res.data.success) {
					setCategoryTitle(res.data.category.title);
					setFilms(res.data.films || []);
					setError(null);
				} else {
					setError(res.data.message || "Không thể tải danh mục");
				}
			} catch (err) {
				console.error("Error fetching category:", err);
				setError("Lỗi khi tải danh mục. Vui lòng thử lại.");
			} finally {
				setIsFetching(false);
			}
		};

		fetchCategory();
	}, [categoryId]);

	// Filter films based on search query
	const filteredFilms = useMemo(() => {
		if (!searchQuery.trim()) {
			return films;
		}
		const query = searchQuery.toLowerCase();
		return films.filter(
			(film) =>
				film.name.toLowerCase().includes(query) ||
				film.original_name.toLowerCase().includes(query) ||
				film.slug.toLowerCase().includes(query),
		);
	}, [searchQuery, films]);

	// Map films to Movie type
	const movies: Movie[] = useMemo(() => {
		return filteredFilms.map((film, index) => mapFilmToMovie(film, index));
	}, [filteredFilms]);

	if (isFetching) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<Loader2 className='h-10 w-10 text-primary animate-spin' />
			</div>
		);
	}

	if (error || !categoryTitle) {
		return (
			<div className='min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center'>
				<div className='w-20 h-20 rounded-full bg-white/5 flex items-center justify-center'>
					<Film className='h-10 w-10 text-primary/80' />
				</div>
				<h2 className='text-xl font-bold text-white'>
					{error || "Danh mục không tồn tại"}
				</h2>
				<p className='text-sm text-gray-400 max-w-md'>
					{error ?
						"Vui lòng kiểm tra lại đường dẫn"
					:	"Danh mục bạn tìm kiếm không còn tồn tại"}
				</p>
				<Button
					className='bg-primary hover:bg-primary/90 text-black rounded-full px-6 font-semibold'
					onClick={() => router.push("/")}
				>
					Về trang chủ
				</Button>
			</div>
		);
	}

	return (
		<section className='w-full px-4 lg:px-32 py-10'>
			<SectionTitle
				title={categoryTitle}
				icon={<Film className='h-5 w-5' />}
			/>

			{/* Search Box */}
			<div className='mb-6'>
				<div className='relative max-w-md'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
					<Input
						placeholder='Tìm kiếm phim...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500'
					/>
				</div>
			</div>

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
						{searchQuery ?
							"Không tìm thấy phim phù hợp"
						:	"Danh mục này chưa có phim"}
					</h3>
					<p className='text-sm text-gray-400'>
						{searchQuery ?
							"Thử tìm kiếm với từ khóa khác"
						:	"Quay lại sau để xem thêm phim mới"}
					</p>
					{searchQuery && (
						<Button
							variant='outline'
							className='border-white/10 text-gray-300 hover:bg-white/10'
							onClick={() => setSearchQuery("")}
						>
							Xóa tìm kiếm
						</Button>
					)}
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
