import { NextRequest,NextResponse } from "next/server";

import { ApiResponse } from "@/utils/ApiResponce";
import { createTab } from "@/controller/tab.controller";


export async function POST(req:NextRequest) {
    
    try {
        const data = await req.json();

        const tab = await createTab(data);

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