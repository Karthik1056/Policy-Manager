import { NextRequest, NextResponse } from "next/server";
import { generateAIPolicyDocument } from "@/controller/ai-document.controller";
import { ApiResponse } from "@/utils/ApiResponce";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const buffer = await generateAIPolicyDocument(id);

        return new NextResponse(buffer as any, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="policy-ai-${id}.docx"`
            }
        });
    } catch (error: any) {
        return new ApiResponse(error.statusCode || 500, error.message, null, false);
    }
}
