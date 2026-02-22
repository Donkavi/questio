import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import QuizAttempt from "@/lib/models/QuizAttempt";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { quizId, score, totalQuestions, answers } = body;

        await dbConnect();

        const newAttempt = new QuizAttempt({
            userId: (session.user as any).id,
            quizId,
            score,
            totalQuestions,
            answers,
            completedAt: new Date()
        });

        await newAttempt.save();

        return NextResponse.json({ success: true, attemptId: newAttempt._id });
    } catch (error: any) {
        console.error("Save attempt error:", error);
        return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;

        const attempts = await QuizAttempt.find({ userId })
            .populate('quizId', 'title category mcqs')
            .sort({ completedAt: -1 });

        return NextResponse.json({ attempts });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 });
    }
}
