import { deleteField, updateField } from "@/controller/field.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";
import { assertMakerForPolicyEdit, getUserFromRequest } from "@/lib/adminAuth";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Field ID is missing" },
                { status: 400 }
            );
        }

        const userData = getUserFromRequest(req);
        assertMakerForPolicyEdit(userData.role);

        const data = await req.json();

        const result = await updateField(id, data, userData);

        return NextResponse.json(
            new ApiResponse(200, "Field updated successfully", result, true),
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
                { success: false, message: "Field ID is missing" },
                { status: 400 }
            );
        }

        const userData = getUserFromRequest(req);
        assertMakerForPolicyEdit(userData.role);

        const result = await deleteField(id, userData);

        return NextResponse.json(
            new ApiResponse(200, "Field deleted successfully", result, true),
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(500, error.message || "Internal server error", "", false),
            { status: 500 }
        );
    }
}
