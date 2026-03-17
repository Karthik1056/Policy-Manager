import { NextRequest,NextResponse } from "next/server";

import { ApiResponse } from "@/utils/ApiResponce";
import { createTab } from "@/controller/tab.controller";
import { assertMakerForPolicyEdit, getUserFromRequest } from "@/lib/adminAuth";


export async function POST(req:NextRequest) {
    
    try {
        const userData = getUserFromRequest(req);
        assertMakerForPolicyEdit(userData.role);
        const data = await req.json();

        const tab = await createTab(data, userData);

        return NextResponse.json(
            new ApiResponse(201,"Tab created successfully",tab,true),
            {status:201}
        )
    } catch (error: any) {
        const message = String(error?.message || "Internal server error");
        const normalized = message.toLowerCase();
        const derivedStatus = normalized.includes("unauthorized")
            ? 401
            : normalized.includes("forbidden")
                ? 403
                : 500;
        const statusCode = Number(error?.statusCode) || derivedStatus;
        return NextResponse.json(
            new ApiResponse(statusCode, message, "", false),
            {status:statusCode}
        )
    }
}
