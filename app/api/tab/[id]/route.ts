import { deleteTab, updateTab } from "@/controller/tab.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";
import { assertMakerForPolicyEdit, getUserFromRequest } from "@/lib/adminAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userData = getUserFromRequest(req);
    assertMakerForPolicyEdit(userData.role);

    if (!id) {
      return NextResponse.json({ message: "Id is required" }, { status: 400 });
    }

    const data = await req.json();
    if (!data) {
      return NextResponse.json({ message: "Data is required" }, { status: 400 });
    }

    const update = await updateTab(id, data, userData);

    return NextResponse.json(new ApiResponse(200, "Tab updated successfully", update, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(500, error?.message || "Internal server error", "", false), { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userData = getUserFromRequest(req);
    assertMakerForPolicyEdit(userData.role);

    if (!id) {
      return NextResponse.json({ success: false, message: "Policy ID is missing" }, { status: 400 });
    }

    await deleteTab(id, userData);

    return NextResponse.json(new ApiResponse(200, "Deleted tab with id successfully", "", true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(500, error?.message || "Internal server error", "", false), { status: 500 });
  }
}
