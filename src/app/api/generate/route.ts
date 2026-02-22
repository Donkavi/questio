import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { parseDocument } from "@/lib/documentParser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import MCQSet from "@/lib/models/MCQSet";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const language = formData.get("language") as string;
        const questionCount = parseInt(formData.get("count") as string, 10) || 10;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Read the file as buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse text from file
        const textContent = await parseDocument(buffer, file.type);
        if (!textContent || textContent.trim().length === 0) {
            return NextResponse.json({ error: "Could not extract text from document" }, { status: 400 });
        }

        const prompt = `
    You are an expert AI teacher and examiner. Create ${questionCount} multiple choice questions (MCQs) based on the provided text.
    The questions should be challenging but directly derived from the text context.
    The output language must be strictly: ${language || "English"}.
    
    Format the response as a JSON array of objects with the following keys:
    [
      {
        "question": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "The exact text of the correct option",
        "explanation": "Brief explanation of why this answer is correct based on the text"
      }
    ]
    
    Ensure the JSON is strictly well-formed with no extra wrapping text or markdown blocks like \`\`\`json. Valid JSON only.
    
    Source Text Context:
    ---
    ${textContent.substring(0, 30000)}
    ---
    `;

        // Process with Gemini
        const modelName = formData.get("model") as string || "gemini-1.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        let rawResponse = result.response.text().trim();

        // Clean potential markdown formatting
        if (rawResponse.startsWith('```json')) {
            rawResponse = rawResponse.substring(7);
        }
        if (rawResponse.startsWith('```')) {
            rawResponse = rawResponse.substring(3);
        }
        if (rawResponse.endsWith('```')) {
            rawResponse = rawResponse.substring(0, rawResponse.length - 3);
        }

        let mcqs = JSON.parse(rawResponse.trim());

        if (!Array.isArray(mcqs)) {
            throw new Error("Invalid format received from AI");
        }

        // Validate standard format
        mcqs = mcqs.map(q => ({
            question: q.question || "Invalid question",
            options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ["N/A"],
            correctAnswer: q.correctAnswer || "N/A",
            explanation: q.explanation || ""
        }));

        await dbConnect();

        const newMCQSet = new MCQSet({
            title: `${file.name.replace(/\.[^/.]+$/, "")} MCQs`,
            mcqs,
            creatorId: (session.user as any).id,
            language: language === "Sinhala" ? "Sinhala" : "English",
            documentReference: file.name,
            category: formData.get("category") as string || "General",
            isPublic: formData.get("isPublic") === "true",
            password: formData.get("password") as string || ""
        });

        await newMCQSet.save();

        return NextResponse.json({ success: true, setId: newMCQSet._id, mcqs });

    } catch (error: any) {
        console.error("Generate MCQ Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate MCQs" }, { status: 500 });
    }
}
