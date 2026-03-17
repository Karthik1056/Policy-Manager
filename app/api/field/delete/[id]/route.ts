import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/utils/ApiResponce";
import { prisma } from "@/lib/prisma";
import { assertMakerForPolicyEdit, getUserFromRequest } from "@/lib/adminAuth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userData = getUserFromRequest(req);
    assertMakerForPolicyEdit(userData.role);
    const { id } = await params;
    
    const field = await prisma.field.findUnique({
      where: { id },
      include: { subTab: { include: { tab: true } } }
    });

    if (!field) {
      return NextResponse.json(
        new ApiResponse(404, "Field not found", "", false),
        { status: 404 }
      );
    }

    await prisma.field.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        policyEngineId: field.subTab.tab.policyEngineId,
        action: "UPDATED",
        details: `Field deleted: ${field.fieldName}`,
        performedBy: userData?.name || "SYSTEM",
      }
    });

    return NextResponse.json(
      new ApiResponse(200, "Field deleted successfully", "", true),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      new ApiResponse(500, "Internal server error", "", false),
      { status: 500 }
    );
  }
}
