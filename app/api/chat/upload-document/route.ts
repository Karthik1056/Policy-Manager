import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        // Forward the raw multipart form to the crewai-agent
        const formData = await request.formData();
        
        const response = await fetch("http://localhost:8000/api/chat/upload-document", {
            method: "POST",
            body: formData,
            // Do NOT set Content-Type — fetch sets it automatically with the boundary
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: "Upload failed" }));
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Upload proxy error:", error);
        return NextResponse.json(
            { detail: "Could not connect to document processor. Is the AI server running on port 8000?" },
            { status: 502 }
        );
    }
}
