import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/utils/ApiResponce";
import { prisma } from "@/lib/prisma";
import { assertMakerForPolicyEdit, getUserFromRequest } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userData = getUserFromRequest(req);
    assertMakerForPolicyEdit(userData.role);
    const data = await req.json();
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

    const updatedField = await prisma.field.update({
      where: { id },
      data
    });

    await prisma.auditLog.create({
      data: {
        policyEngineId: field.subTab.tab.policyEngineId,
        action: "UPDATED",
        details: `Field updated: ${field.fieldName}`,
        performedBy: userData?.name || "SYSTEM",
      }
    });

    return NextResponse.json(
      new ApiResponse(200, "Field updated successfully", updatedField, true),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      new ApiResponse(500, "Internal server error", "", false),
      { status: 500 }
    );
  }
}
