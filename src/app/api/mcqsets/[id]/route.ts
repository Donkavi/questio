import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import MCQSet from "@/lib/models/MCQSet";

// Handler for fetching a specific MCQ set
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const set = await MCQSet.findById(id);

        if (!set) {
            return NextResponse.json({ error: "MCQ Set not found" }, { status: 404 });
        }

        return NextResponse.json({ set });
    } catch (error: any) {
        console.error("GET MCQ Set Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// Handler for updating quiz metadata (Category, Privacy, Password)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { category, isPublic, password } = body;

        await dbConnect();
        const set = await MCQSet.findById(id);

        if (!set) {
            return NextResponse.json({ error: "MCQ Set not found" }, { status: 404 });
        }

        // Verify ownership
        if (set.creatorId.toString() !== (session.user as any).id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Update fields
        if (category) set.category = category;
        if (typeof isPublic === "boolean") set.isPublic = isPublic;
        if (password !== undefined) set.password = password;

        await set.save();

        return NextResponse.json({ success: true, set });
    } catch (error: any) {
        console.error("PATCH MCQ Set Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
