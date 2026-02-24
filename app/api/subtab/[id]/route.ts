import { deleteSubTab, updateSubTab } from "@/controller/subtab.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "SubTab ID is missing" },
                { status: 400 }
            );
        }

        const data = await req.json();

        const result = await updateSubTab(id, data);

        return NextResponse.json(
            new ApiResponse(200, "SubTab updated successfully", result, true),
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(500, error.message || "Internal server error", "", false),
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "SubTab ID is missing" },
                { status: 400 }
            );
        }

        const result = await deleteSubTab(id);

        return NextResponse.json(
            new ApiResponse(200, "SubTab deleted successfully", result, true),
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(500, error.message || "Internal server error", "", false),
            { status: 500 }
        );
    }
}
