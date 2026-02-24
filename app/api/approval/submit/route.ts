import { NextResponse, NextRequest } from "next/server";
import { submitToQueue } from "@/controller/approval.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { ApiError } from "@/utils/ApiError";

export async function POST(req: NextRequest) {
    try {
        const { policyId } = await req.json();
        
        // Get user data from headers (passed by your Auth Middleware)
        const userData = JSON.parse(req.headers.get("x-user-data") || "{}");

        if (!policyId) {
            throw new ApiError(400, "Policy ID is required to submit");
        }

        const result = await submitToQueue(policyId, userData);

        return NextResponse.json(
            new ApiResponse(201, "Policy submitted to queue successfully", result, true),
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(error.statusCode || 500, error.message, null, false),
            { status: error.statusCode || 500 }
        );
    }
}