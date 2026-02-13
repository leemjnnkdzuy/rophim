import { NextResponse } from 'next/server';
import connectDatabase from '@/app/utils/connectDB';
import Film from '@/app/models/Film';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        await connectDatabase();
        const allGenres = await Film.distinct("genres.name");
        return NextResponse.json(allGenres || [], {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error("Failed to fetch genres:", error);
        return NextResponse.json([], { status: 500 });
    }
}
