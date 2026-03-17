import { NextRequest,NextResponse } from "next/server";

import { ApiResponse } from "@/utils/ApiResponce";
import { createSubTab } from "@/controller/subtab.controller";
import { assertMakerForPolicyEdit, getUserFromRequest } from "@/lib/adminAuth";

export async function POST(req:NextRequest) {
    try {
        const userData = getUserFromRequest(req);
        assertMakerForPolicyEdit(userData.role);
        const data = await req.json();

        if(!data){
            return NextResponse.json(
                new ApiResponse(400,"Bad request","",false),
                {status: 400}
            )
        }

        const returnData = await createSubTab(data, userData);

        return NextResponse.json(
            new ApiResponse(201, "SubTab created successfully", returnData, true),
            {status: 201}
        )
    } catch (error: any) {
        const statusCode = Number(error?.statusCode) || 500;
        return NextResponse.json(
            new ApiResponse(statusCode, error?.message || "Internal server error", "", false),
            {status: statusCode}
        )
    }
}
