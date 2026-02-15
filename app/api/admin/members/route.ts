import { NextRequest, NextResponse } from "next/server";
import connectDatabase from "@/app/utils/connectDB";
import User from "@/app/models/User";
import { verifyAdmin } from "@/app/utils/adminAuth";

// GET: Fetch members with pagination and search
export async function GET(request: NextRequest) {
    try {
        // Verify admin access
        const authResult = await verifyAdmin(request);
        if (authResult.error) {
            return NextResponse.json(
                { success: false, message: authResult.error },
                { status: authResult.status },
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";

        const skip = (page - 1) * limit;

        // Build query
        const query: any = {};
        if (search) {
            const searchRegex = new RegExp(search, "i");
            query.$or = [{ username: searchRegex }, { email: searchRegex }];
        }

        await connectDatabase();

        // Fetch members
        const rawMembers = await User.find(query)
            .select("-password -watchHistory -savedFilms") // Exclude sensitive/large fields
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const members = rawMembers.map((member) => ({
            ...member,
            _id: member._id.toString(),
            avatar:
                member.avatar && member.avatar.data ?
                    `data:${member.avatar.mime};base64,${member.avatar.data}`
                    : undefined,
        }));

        // Count total members for pagination
        const totalMembers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalMembers / limit);

        return NextResponse.json({
            success: true,
            members,
            totalPages,
            currentPage: page,
            totalMembers,
        });
    } catch (error) {
        console.error("Admin members fetch error:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server. Vui lòng thử lại sau." },
            { status: 500 },
        );
    }
}

// PATCH: Update member status
export async function PATCH(request: NextRequest) {
    try {
        // Verify admin access
        const authResult = await verifyAdmin(request);
        if (authResult.error) {
            return NextResponse.json(
                { success: false, message: authResult.error },
                { status: authResult.status },
            );
        }

        const body = await request.json();
        const { userId, role, isActive } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID is required" },
                { status: 400 },
            );
        }

        await connectDatabase();

        const updateData: any = {};
        if (role) updateData.role = role;
        if (typeof isActive === "boolean") updateData.isActive = isActive;

        const updatedUserRaw = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select("-password -watchHistory -savedFilms").lean();

        if (!updatedUserRaw) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 },
            );
        }

        const updatedUser = {
            ...updatedUserRaw,
            _id: updatedUserRaw._id.toString(),
            avatar:
                updatedUserRaw.avatar && updatedUserRaw.avatar.data ?
                    `data:${updatedUserRaw.avatar.mime};base64,${updatedUserRaw.avatar.data}`
                    : undefined,
        };

        return NextResponse.json({
            success: true,
            message: "Cập nhật thành công",
            member: updatedUser,
        });

    } catch (error) {
        console.error("Admin member update error:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server. Vui lòng thử lại sau." },
            { status: 500 },
        );
    }
}

