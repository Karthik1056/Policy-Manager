import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        new ApiResponse(400, "Policy id is required", null, false),
        { status: 400 }
      );
    }

    const versions = await prisma.policyVersion.findMany({
      where: { policyEngineId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      new ApiResponse(200, "Versions fetched successfully", versions, true),
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      new ApiResponse(500, "Internal server error", "", false),
      { status: 500 }
    );
  }
}
