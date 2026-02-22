import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import LiveSession from "@/lib/models/LiveSession";
import MCQSet from "@/lib/models/MCQSet";

// Create a new live session
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { quizId, timeLimit } = body;

        await dbConnect();

        // Check if quiz exists
        const quiz = await MCQSet.findById(quizId);
        if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

        // Check ownership
        if (quiz.creatorId.toString() !== (session.user as any).id) {
            return NextResponse.json({ error: "Only owners can start live sessions" }, { status: 403 });
        }

        const newLiveSession = new LiveSession({
            quizId,
            ownerId: (session.user as any).id,
            timeLimit: timeLimit || 30,
            status: 'waiting',
            participants: []
        });

        await newLiveSession.save();

        return NextResponse.json({ success: true, sessionId: newLiveSession._id });
    } catch (error: any) {
        console.error("Create Live Session Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// Get active live sessions (for browsing)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const isOwnerQuery = searchParams.get('owner') === 'true';

        await dbConnect();

        if (isOwnerQuery) {
            const session = await getServerSession(authOptions);
            if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

            const userId = (session.user as any).id;
            const mySessions = await LiveSession.find({ ownerId: userId })
                .populate('quizId', 'title category mcqs')
                .populate('participants.userId', 'name image')
                .sort({ createdAt: -1 });

            return NextResponse.json({ sessions: mySessions });
        }

        const activeSessions = await LiveSession.find({ status: { $ne: 'completed' } })
            .populate('quizId', 'title category isPublic')
            .populate('ownerId', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json({ sessions: activeSessions });
    } catch (error: any) {
        console.error("Fetch Live Sessions Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
