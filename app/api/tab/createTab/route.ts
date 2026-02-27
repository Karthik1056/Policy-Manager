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
    } catch (error) {
        return NextResponse.json(
            new ApiResponse(500,"Internal server error","",false),
            {status:500}
        )
    }
}
