import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import MCQSet from "@/lib/models/MCQSet";

export async function GET(req: any) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // 'my' or 'public'
        const category = searchParams.get("category");
        const search = searchParams.get("search");

        await dbConnect();
        const userId = (session.user as any).id;

        let query: any = {};

        if (type === 'public') {
            query.isPublic = true;
        } else {
            query.creatorId = userId;
        }

        if (category && category !== 'All') {
            query.category = category;
        }
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const sets = await MCQSet.find(query).sort({ createdAt: -1 });

        return NextResponse.json({ sets });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch sets" }, { status: 500 });
    }
}
