import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import LiveSession from "@/lib/models/LiveSession";
import MCQSet from "@/lib/models/MCQSet";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await dbConnect();
        const session = await LiveSession.findById(id)
            .populate('quizId')
            .populate('ownerId', 'name image')
            .populate('participants.userId', 'name image');

        if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

        return NextResponse.json({ session });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// Actions: join, start, submit, end
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const authSession = await getServerSession(authOptions);
        if (!authSession || !authSession.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body;

        await dbConnect();
        const liveSession = await LiveSession.findById(id);
        if (!liveSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

        const userId = (authSession.user as any).id;

        if (action === "join") {
            if (liveSession.status !== 'waiting') return NextResponse.json({ error: "Session already started" }, { status: 400 });

            // Check if already in
            const existing = liveSession.participants.find((p: any) => p.userId.toString() === userId);
            if (!existing) {
                liveSession.participants.push({
                    userId,
                    name: authSession.user.name,
                    joinedAt: new Date()
                });
                await liveSession.save();
            }
            return NextResponse.json({ success: true });
        }

        if (action === "start") {
            if (liveSession.ownerId.toString() !== userId) return NextResponse.json({ error: "Only owner can start" }, { status: 403 });

            liveSession.status = 'active';
            liveSession.startTime = new Date();
            liveSession.endTime = new Date(Date.now() + liveSession.timeLimit * 60000);
            await liveSession.save();
            return NextResponse.json({ success: true });
        }

        if (action === "end") {
            if (liveSession.ownerId.toString() !== userId) return NextResponse.json({ error: "Only owner can end" }, { status: 403 });

            liveSession.status = 'completed';
            liveSession.endTime = new Date();
            await liveSession.save();
            return NextResponse.json({ success: true });
        }

        if (action === "submit") {
            const { answers, score, progress } = body;
            const participant = liveSession.participants.find((p: any) => p.userId.toString() === userId);
            if (!participant) return NextResponse.json({ error: "Not a participant" }, { status: 400 });

            participant.answers = answers;
            participant.score = score;
            participant.progress = progress;
            participant.isFinished = true;

            await liveSession.save();
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Live Session Action Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
