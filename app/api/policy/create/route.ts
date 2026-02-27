import { createPolicy } from "@/controller/policy.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextResponse,NextRequest } from "next/server";
import { assertMakerForPolicyEdit, getUserFromRequest } from "@/lib/adminAuth";


export async function POST(req:NextRequest){
    try {
        const userData = getUserFromRequest(req);
        assertMakerForPolicyEdit(userData.role);
        
        const body = await req.json();

        const policy = await createPolicy(body, userData);

        return NextResponse.json(
            new ApiResponse(201,"Policy created successfully",policy,true),
            {status:201}
        )
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(500, error.message || "Internal server error","",false),
            {status:500}
        )
    }
}
