import { NextResponse } from 'next/server';
import axios from 'axios';
import connectDatabase from '@/app/utils/connectDB';
import Film from '@/app/models/Film';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        if (!slug) {
            return NextResponse.json(
                { message: 'Slug is required' },
                { status: 400 }
            );
        }

        // Kết nối DB
        await connectDatabase();

        // Chạy song song: Lấy dữ liệu từ API phim và từ DB local
        const [externalRes, localFilm] = await Promise.all([
            axios.get(`https://phim.nguonc.com/api/film/${slug}`, {
                timeout: 10000,
            }).catch(() => null),
            Film.findOne({ slug }).lean()
        ]);

        if (externalRes?.data?.status === 'success' && externalRes?.data?.movie) {
            const movieData = externalRes.data.movie;

            // Gộp dữ liệu từ local DB
            if (localFilm) {
                movieData.rating = localFilm.rating || 0;
                movieData.views = localFilm.views || 0;
                movieData.is_featured = localFilm.is_featured || false;
            } else {
                movieData.rating = 0;
                movieData.views = 0;
                movieData.is_featured = false;
            }

            return NextResponse.json({
                ...externalRes.data,
                movie: movieData
            }, {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                },
            });
        }

        return NextResponse.json(
            { message: 'Film not found' },
            { status: 404 }
        );
    } catch (error: any) {
        console.error('Error fetching film detail:', error.message);
        return NextResponse.json(
            { message: 'Error fetching film detail', error: error.message },
            { status: error.response?.status || 500 }
        );
    }
}
