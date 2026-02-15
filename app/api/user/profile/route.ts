import { NextRequest, NextResponse } from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import User from "@/app/models/User";
import Film from "@/app/models/Film";
import { verifyAccessToken } from "@/app/utils/jwt";
import axios from "axios";

function getUserId(request: NextRequest): string | null {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) return null;
    const payload = verifyAccessToken(accessToken);
    return payload?.userId || null;
}

// GET: Fetch profile by username or own profile
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const username = url.searchParams.get("username");
        const currentUserId = getUserId(request);

        await connectDatabase();

        let user;
        let isOwnProfile = false;

        if (username) {
            // View another user's profile
            user = await User.findOne({ username: username.toLowerCase() })
                .select("username avatar savedFilms showSavedFilms createdAt")
                .lean();

            if (!user) {
                return NextResponse.json(
                    { success: false, message: "Không tìm thấy người dùng" },
                    { status: 404 },
                );
            }

            // Check if it's own profile
            if (currentUserId && user._id.toString() === currentUserId) {
                isOwnProfile = true;
            }
        } else {
            // View own profile (must be logged in)
            if (!currentUserId) {
                return NextResponse.json(
                    { success: false, message: "Chưa đăng nhập" },
                    { status: 401 },
                );
            }

            user = await User.findById(currentUserId)
                .select("username avatar savedFilms showSavedFilms createdAt")
                .lean();

            if (!user) {
                return NextResponse.json(
                    { success: false, message: "Không tìm thấy người dùng" },
                    { status: 404 },
                );
            }

            isOwnProfile = true;
        }

        // Build avatar URL
        const avatarUrl =
            user.avatar?.data
                ? `data:${user.avatar.mime};base64,${user.avatar.data}`
                : "";

        // Determine if saved films should be shown
        const showSavedFilms = user.showSavedFilms !== false; // default true
        const shouldShowFilms = isOwnProfile || showSavedFilms;

        let savedFilms: object[] = [];
        if (shouldShowFilms && user.savedFilms && user.savedFilms.length > 0) {
            const films = await Film.find({ slug: { $in: user.savedFilms } })
                .select("name slug original_name poster_url thumb_url quality language years formats total_episodes")
                .lean();

            // Helper to fetch current episode
            const fetchCurrentEpisode = async (filmSlug: string) => {
                try {
                    const response = await axios.get(
                        `https://phim.nguonc.com/api/film/${filmSlug}`,
                        { timeout: 5000 },
                    );
                    return response.data?.movie?.current_episode || null;
                } catch {
                    return null;
                }
            };

            // Enrich with current_episode
            const filmMap = new Map(films.map((f) => [f.slug, f]));
            const orderedFilms = user.savedFilms
                .map((slug: string) => filmMap.get(slug))
                .filter((film): film is NonNullable<typeof film> =>
                    Boolean(film),
                ) as object[];

            savedFilms = await Promise.all(
                orderedFilms.map(async (film: any) => {
                    const currentEpisode = await fetchCurrentEpisode(film.slug);
                    return {
                        ...film,
                        current_episode: currentEpisode,
                    };
                }),
            );
        }

        return NextResponse.json({
            success: true,
            profile: {
                username: user.username,
                avatar: avatarUrl,
                savedFilms: shouldShowFilms ? savedFilms : [],
                savedCount: user.savedFilms?.length || 0,
                showSavedFilms,
                isOwnProfile,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Profile error:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server" },
            { status: 500 },
        );
    }
}

// PATCH: Update profile (showSavedFilms, avatar)
export async function PATCH(request: NextRequest) {
    try {
        const userId = getUserId(request);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Chưa đăng nhập" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const { showSavedFilms, avatar } = body;

        await connectDatabase();

        const updateData: Record<string, unknown> = {};

        // Handle showSavedFilms toggle
        if (typeof showSavedFilms === "boolean") {
            updateData.showSavedFilms = showSavedFilms;
        }

        // Handle avatar update (base64 data URL)
        if (avatar && typeof avatar === "string") {
            // Validate and parse data URL: "data:image/webp;base64,..."
            const match = avatar.match(/^data:(image\/\w+);base64,(.+)$/);
            if (!match) {
                return NextResponse.json(
                    { success: false, message: "Định dạng ảnh không hợp lệ" },
                    { status: 400 },
                );
            }

            const mime = match[1];
            const data = match[2];

            // Check size (base64 is ~33% larger than binary, limit to ~2MB raw)
            if (data.length > 3 * 1024 * 1024) {
                return NextResponse.json(
                    { success: false, message: "Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn." },
                    { status: 400 },
                );
            }

            updateData.avatar = { mime, data };
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { success: false, message: "Không có dữ liệu cập nhật" },
                { status: 400 },
            );
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
            .select("avatar showSavedFilms")
            .lean();

        const responseData: Record<string, unknown> = { success: true };

        if (typeof showSavedFilms === "boolean") {
            responseData.showSavedFilms = updatedUser?.showSavedFilms;
        }

        if (avatar) {
            responseData.avatar = updatedUser?.avatar?.data
                ? `data:${updatedUser.avatar.mime};base64,${updatedUser.avatar.data}`
                : "";
        }

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server" },
            { status: 500 },
        );
    }
}
