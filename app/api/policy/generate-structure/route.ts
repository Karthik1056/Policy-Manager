import { NextRequest, NextResponse } from "next/server";
import { generatePolicyStructure } from "@/controller/ai-generate.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { assertMakerForPolicyEdit, getUserFromRequest } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
    try {
        const userData = getUserFromRequest(request);
        assertMakerForPolicyEdit(userData.role);

        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                new ApiResponse(400, "Prompt is required", "", false),
                { status: 400 }
            );
        }

        const structure = await generatePolicyStructure(prompt);
        return NextResponse.json(
            new ApiResponse(200, "Policy structure generated successfully", structure, true),
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(error?.statusCode || 500, error?.message || "Failed to generate structure", "", false),
            { status: error?.statusCode || 500 }
        );
    }
}
