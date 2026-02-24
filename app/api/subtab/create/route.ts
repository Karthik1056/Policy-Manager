import { NextRequest,NextResponse } from "next/server";

import { ApiResponse } from "@/utils/ApiResponce";
import { createSubTab } from "@/controller/subtab.controller";

export async function POST(req:NextRequest) {
    try {
        const data = await req.json();

        if(!data){
            return NextResponse.json(
                new ApiResponse(400,"Bad request","",false),
                {status: 400}
            )
        }

        const returnData = await createSubTab(data);

        return NextResponse.json(
            new ApiResponse(201, "SubTab created successfully", returnData, true),
            {status: 201}
        )
    } catch (error) {
        return NextResponse.json(
            new ApiResponse(500, "Internal server error", "", false),
            {status: 500}
        )
    }
}