import { NextResponse } from 'next/server';
import connectDatabase from '@/app/utils/connectDB';
import Film from '@/app/models/Film';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        await connectDatabase();
        // Fetch distinct format names from the database
        const allFormats = await Film.distinct("formats.name");
        return NextResponse.json(allFormats || [], {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error("Failed to fetch formats:", error);
        return NextResponse.json([], { status: 500 });
    }
}
