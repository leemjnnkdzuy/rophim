import { NextResponse } from 'next/server';
import connectDatabase from '@/app/utils/connectDB';
import Film from '@/app/models/Film';

export async function POST(request: Request) {
    try {
        const { slug } = await request.json();

        if (!slug) {
            return NextResponse.json(
                { message: 'Slug is required' },
                { status: 400 }
            );
        }

        await connectDatabase();

        // Increment views by 1
        const updatedFilm = await Film.findOneAndUpdate(
            { slug },
            { $inc: { views: 1 } },
            { new: true, upsert: true } // Create if not exists (though unlikely for view increment if film should exist first, but safe for sync issues)
        );

        return NextResponse.json(
            { message: 'View incremented', views: updatedFilm.views },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error incrementing view:', error);
        return NextResponse.json(
            { message: 'Error incrementing view', error: error.message },
            { status: 500 }
        );
    }
}
