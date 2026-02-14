import { NextResponse } from 'next/server';
import connectDatabase from '@/app/utils/connectDB';
import Film from '@/app/models/Film';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        await connectDatabase();
        const allYears = await Film.distinct("years.name");

        const sortedYears = allYears
            .filter((y) => y && String(y).trim() !== "")
            .sort((a, b) => {
                const numA = parseInt(a);
                const numB = parseInt(b);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numB - numA;
                }
                return String(b).localeCompare(String(a));
            });

        return NextResponse.json(sortedYears || [], {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error("Failed to fetch years:", error);
        return NextResponse.json([], { status: 500 });
    }
}
