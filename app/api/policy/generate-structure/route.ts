import { NextRequest, NextResponse } from "next/server";
import { generatePolicyStructure } from "@/controller/ai-generate.controller";
import { ApiResponce } from "@/utils/ApiResponce";

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();
        
        if (!prompt) {
            return ApiResponce(400, null, "Prompt is required");
        }

        const structure = await generatePolicyStructure(prompt);
        return ApiResponce(200, structure, "Policy structure generated successfully");
    } catch (error: any) {
        return ApiResponce(error.statusCode || 500, null, error.message);
    }
}
