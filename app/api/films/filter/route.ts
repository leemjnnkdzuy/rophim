import { NextResponse } from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import Film from "@/app/models/Film";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const genre = searchParams.get("genre");
        const country = searchParams.get("country");
        const year = searchParams.get("year");
        const sort = searchParams.get("sort") || "views"; // views, rating, latest
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "24");
        const skip = (page - 1) * limit;

        if (!genre && !country) {
            return NextResponse.json(
                { message: "Genre or country parameter is required", films: [] },
                { status: 400 },
            );
        }

        await connectDatabase();

        // Build filter query
        const filter: Record<string, unknown> = {};
        if (genre) {
            filter["genres.name"] = genre;
        }
        if (country) {
            filter["countries.name"] = country;
        }
        if (year && year !== "Tất cả") {
            filter["years.name"] = year;
        }

        // Build sort query
        let sortQuery: Record<string, 1 | -1> = {};
        switch (sort) {
            case "rating":
                sortQuery = { rating: -1, views: -1 };
                break;
            case "latest":
                sortQuery = { modified: -1 };
                break;
            case "views":
            default:
                sortQuery = { views: -1, modified: -1 };
                break;
        }

        const [films, totalCount] = await Promise.all([
            Film.find(filter)
                .sort(sortQuery)
                .skip(skip)
                .limit(limit)
                .lean(),
            Film.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json(
            {
                films,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            },
            {
                headers: {
                    "Cache-Control":
                        "public, s-maxage=120, stale-while-revalidate=300",
                },
            },
        );
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.error("[API] Error filtering films:", errorMessage);
        return NextResponse.json(
            { message: "Error filtering films", error: errorMessage, films: [] },
            { status: 500 },
        );
    }
}
