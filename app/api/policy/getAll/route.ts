import { getAllPolicies } from "@/controller/policy.controller";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {

    try {
        const policies = await getAllPolicies();

        return NextResponse.json(
            new ApiResponse(200,"All policies fetch successfully",policies,true),
            {status:200}
        )
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(500,"Internal server error","",false),
            {status:500}
        )
    }


}