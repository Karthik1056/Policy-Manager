import { createField } from "@/controller/field.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const userDataHeader = req.headers.get("x-user-data");
        const userData = userDataHeader ? JSON.parse(userDataHeader) : undefined;

        const data = await req.json();

        const result = await createField(data, userData);

        return NextResponse.json(
            new ApiResponse(201, "Field created successfully", result, true),
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(500, error.message || "Internal server error", "", false),
            { status: 500 }
        );
    }
}
