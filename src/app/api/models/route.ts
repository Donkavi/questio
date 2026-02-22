import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        // Using the v1 endpoint for listing models as some specific beta versions might restrict listModels
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json();

        // Filter for models that support generateContent
        const models = data.models
            .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
            .map((m: any) => ({
                name: m.name.replace("models/", ""),
                displayName: m.displayName,
                description: m.description
            }));

        return NextResponse.json({ models });
    } catch (error: any) {
        console.error("List Models Error:", error);
        return NextResponse.json({ error: error.message || "Failed to list models" }, { status: 500 });
    }
}
