import { createPolicy } from "@/controller/policy.controller";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextResponse,NextRequest } from "next/server";


export async function POST(req:NextRequest){
    try {
        const userData = req.headers.get("x-user-data");

        if(!userData){
            return NextResponse.json({message:"User data not found"},{status:400})
        }
        
        const body = await req.json();

        const policy = await createPolicy(body,JSON.parse(userData));

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