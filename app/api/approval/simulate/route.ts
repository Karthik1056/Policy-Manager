import { NextResponse, NextRequest } from "next/server";
import { simulatePolicyLogic } from "@/controller/approval.controller";
import { ApiResponse } from "@/utils/ApiResponce";

export async function POST(req: NextRequest) {
    try {
        const { policyId, testData } = await req.json();

        if (!policyId || !testData) {
            return NextResponse.json(
                new ApiResponse(400, "Policy ID and Test Data are required", null, false), 
                { status: 400 }
            );
        }

        const results = await simulatePolicyLogic(policyId, testData);

        return NextResponse.json(
            new ApiResponse(200, "Simulation completed", results, true),
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(error.statusCode || 500, error.message, null, false),
            { status: error.statusCode || 500 }
        );
    }
}