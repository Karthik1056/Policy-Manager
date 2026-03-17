import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/utils/ApiResponce";
import { updateSubTab } from "@/controller/subtab.controller";
import { assertMakerForPolicyEdit, getUserFromRequest } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userData = getUserFromRequest(req);
    assertMakerForPolicyEdit(userData.role);
    const data = await req.json();
    const { id } = await params;

    const updatedSubTab = await updateSubTab(id, data, userData);

    return NextResponse.json(
      new ApiResponse(200, "SubTab updated successfully", updatedSubTab, true),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      new ApiResponse(500, "Internal server error", "", false),
      { status: 500 }
    );
  }
}
