import { NextResponse, NextRequest } from "next/server";
import { submitToQueue, simulatePolicyLogic, approveAndPublish } from "@/controller/approval.controller";
import { ApiResponse } from "@/utils/ApiResponce";

// POST /api/approval -> Submit to Queue
export async function POST(req: NextRequest) {
    try {
        const { policyId, action, testData } = await req.json();
        const userData = JSON.parse(req.headers.get("x-user-data") || "{}");

        if (action === "SUBMIT") {
            const res = await submitToQueue(policyId, userData);
            return NextResponse.json(new ApiResponse(201, "Submitted", res, true));
        }

        if (action === "SIMULATE") {
            const res = await simulatePolicyLogic(policyId, testData);
            return NextResponse.json(new ApiResponse(200, "Simulation Done", res, true));
        }

        if (action === "APPROVE") {
            const res = await approveAndPublish(policyId, userData);
            return NextResponse.json(new ApiResponse(200, "Published", res, true));
        }
    } catch (error: any) {
        return NextResponse.json(new ApiResponse(500, error.message, null, false), { status: 500 });
    }
}