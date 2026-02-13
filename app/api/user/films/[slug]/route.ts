import {NextRequest, NextResponse} from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import User from "@/app/models/User";
import {verifyAccessToken} from "@/app/utils/jwt";

interface UserRating {
	filmSlug: string;
	score: number;
	ratedAt: Date;
}

function getUserId(request: NextRequest): string | null {
	const accessToken = request.cookies.get("access_token")?.value;
	if (!accessToken) return null;
	const payload = verifyAccessToken(accessToken);
	return payload?.userId || null;
}

interface RatingRequest {
	rating: number;
}

export async function POST(
	request: NextRequest,
	{params}: {params: {slug: string}},
) {
	try {
		const userId = getUserId(request);
		if (!userId) {
			return NextResponse.json(
				{success: false, message: "Chưa đăng nhập"},
				{status: 401},
			);
		}

		const {rating}: RatingRequest = await request.json();

		if (!rating || rating < 1 || rating > 10 || !Number.isInteger(rating)) {
			return NextResponse.json(
				{
					success: false,
					message: "Invalid rating. Must be between 1 and 10",
				},
				{status: 400},
			);
		}

		const slug = params.slug;

		await connectDatabase();
		const user = await User.findById(userId);

		if (!user) {
			return NextResponse.json(
				{success: false, message: "User not found"},
				{status: 404},
			);
		}

		// Initialize ratings array if not exists
		if (!user.ratings) {
			user.ratings = [];
		}

		// Find existing rating for this film
		const existingRatingIndex = user.ratings.findIndex(
			(r: UserRating) => r.filmSlug === slug,
		);

		if (existingRatingIndex >= 0) {
			// Update existing rating
			user.ratings[existingRatingIndex].score = rating;
			user.ratings[existingRatingIndex].ratedAt = new Date();
		} else {
			// Add new rating
			user.ratings.push({
				filmSlug: slug,
				score: rating,
				ratedAt: new Date(),
			});
		}

		await user.save();

		return NextResponse.json(
			{
				success: true,
				message: "Rating saved successfully",
				rating: {
					filmSlug: slug,
					score: rating,
					ratedAt: new Date(),
				},
			},
			{status: 200},
		);
	} catch (error) {
		console.error("Rating submission error:", error);
		return NextResponse.json(
			{success: false, message: "Internal server error"},
			{status: 500},
		);
	}
}

export async function GET(
	request: NextRequest,
	{params}: {params: {slug: string}},
) {
	try {
		const userId = getUserId(request);
		if (!userId) {
			return NextResponse.json(
				{success: false, message: "Chưa đăng nhập"},
				{status: 401},
			);
		}

		const slug = params.slug;

		await connectDatabase();
		const user = await User.findById(userId);

		if (!user) {
			return NextResponse.json(
				{success: false, message: "User not found"},
				{status: 404},
			);
		}

		// Find rating for this film
		const userRating = user.ratings?.find(
			(r: UserRating) => r.filmSlug === slug,
		);

		return NextResponse.json(
			{
				success: true,
				filmSlug: slug,
				userRating: userRating?.score || null,
				ratedAt: userRating?.ratedAt || null,
			},
			{status: 200},
		);
	} catch (error) {
		console.error("Fetching rating error:", error);
		return NextResponse.json(
			{success: false, message: "Internal server error"},
			{status: 500},
		);
	}
}
