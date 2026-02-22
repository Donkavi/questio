// Polyfill for pdf-parse which depends on browser-only globals in some environments
if (typeof global !== 'undefined') {
    if (!(global as any).DOMMatrix) {
        (global as any).DOMMatrix = class DOMMatrix { constructor() { } };
    }
    if (!(global as any).DOMPoint) {
        (global as any).DOMPoint = class DOMPoint { constructor() { } };
    }
    if (!(global as any).DOMRect) {
        (global as any).DOMRect = class DOMRect { constructor() { } };
    }
}

const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

export async function parseDocument(fileBuffer: Buffer, mimeType: string): Promise<string> {
    try {
        if (mimeType === "application/pdf") {
            const data = await pdfParse(fileBuffer);
            return data.text;
        } else if (
            mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            mimeType === "application/msword"
        ) {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            return result.value;
        } else if (mimeType === "text/plain") {
            return fileBuffer.toString("utf-8");
        } else {
            throw new Error(`Unsupported file type: ${mimeType}`);
        }
    } catch (error) {
        console.error("Document parsing error:", error);
        throw new Error("Failed to parse document content");
    }
}
