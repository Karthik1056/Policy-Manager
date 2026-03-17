import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/utils/ApiResponce";
import { updateTab } from "@/controller/tab.controller";
import { assertMakerForPolicyEdit, getUserFromRequest } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userData = getUserFromRequest(req);
    assertMakerForPolicyEdit(userData.role);
    const data = await req.json();
    const { id } = await params;

    const updatedTab = await updateTab(id, data, userData);

    return NextResponse.json(
      new ApiResponse(200, "Tab updated successfully", updatedTab, true),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      new ApiResponse(500, "Internal server error", "", false),
      { status: 500 }
    );
  }
}
