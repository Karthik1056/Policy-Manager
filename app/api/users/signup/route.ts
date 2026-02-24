import { NextRequest, NextResponse } from "next/server";
import { RegisterUser } from "@/controller/user.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { ApiError } from "@/utils/ApiError";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const user = await RegisterUser(body);
        
        return NextResponse.json(
            new ApiResponse(201, "User registered successfully", user, true),
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(500,"Internal server error","",false),
            {status:500}
        )
    }
}
