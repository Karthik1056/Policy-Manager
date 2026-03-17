import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/utils/ApiResponce";
import { deleteSubTab } from "@/controller/subtab.controller";
import { assertMakerForPolicyEdit, getUserFromRequest } from "@/lib/adminAuth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userData = getUserFromRequest(req);
    assertMakerForPolicyEdit(userData.role);
    const { id } = await params;
    
    await deleteSubTab(id, userData);

    return NextResponse.json(
      new ApiResponse(200, "SubTab deleted successfully", "", true),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      new ApiResponse(500, "Internal server error", "", false),
      { status: 500 }
    );
  }
}
