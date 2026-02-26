import { NextRequest,NextResponse } from "next/server";

import { ApiResponse } from "@/utils/ApiResponce";
import { createSubTab } from "@/controller/subtab.controller";

export async function POST(req:NextRequest) {
    try {
        const userDataHeader = req.headers.get("x-user-data");
        const userData = userDataHeader ? JSON.parse(userDataHeader) : undefined;
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
    } catch (error) {
        return NextResponse.json(
            new ApiResponse(500, "Internal server error", "", false),
            {status: 500}
        )
    }
}
