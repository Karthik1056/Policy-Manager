import { getAuditLogsByPolicy } from "@/controller/audit.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json(new ApiResponse(400, "Policy ID is required", null, false), { status: 400 });
        }

        const logs = await getAuditLogsByPolicy(id);

        return NextResponse.json(
            new ApiResponse(200, "Audit logs fetched successfully", logs, true),
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(error.statusCode || 500, error.message || "Internal server error", null, false),
            { status: error.statusCode || 500 }
        );
    }
}