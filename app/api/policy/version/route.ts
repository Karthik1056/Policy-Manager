import { createPolicyVersion } from "@/controller/version.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { policyId, versionNumber, changeNote } = await req.json();

        const userDataRaw = req.headers.get("x-user-data");
        const userData = JSON.parse(userDataRaw || "{}");

        if (!policyId || !versionNumber) {
            return NextResponse.json(new ApiResponse(400, "Missing required fields", null, false), { status: 400 });
        }

        const version = await createPolicyVersion(policyId, versionNumber, userData, changeNote);

        return NextResponse.json(
            new ApiResponse(201, "Version snapshot created successfully", version, true),
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(error.statusCode || 500, error.message || "Internal server error", null, false),
            { status: error.statusCode || 500 }
        );
    }
}