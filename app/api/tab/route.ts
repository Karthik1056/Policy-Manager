import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const policyId = searchParams.get("policyId");

    if (!policyId) {
      return NextResponse.json(
        new ApiResponse(400, "Policy ID is required", "", false),
        { status: 400 }
      );
    }

    const tabs = await prisma.tab.findMany({
      where: { policyEngineId: policyId },
      orderBy: { orderIndex: "asc" },
      include: {
        subTabs: {
          orderBy: { orderIndex: "asc" },
          include: {
            fields: { orderBy: { orderIndex: "asc" } },
          },
        },
      },
    });

    return NextResponse.json(
      new ApiResponse(200, "Tabs fetched successfully", tabs, true),
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      new ApiResponse(500, "Internal server error", "", false),
      { status: 500 }
    );
  }
}
