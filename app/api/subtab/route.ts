import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tabId = searchParams.get("tabId");

    if (!tabId) {
      return NextResponse.json(
        new ApiResponse(400, "Tab ID is required", "", false),
        { status: 400 }
      );
    }

    const subTabs = await prisma.subTab.findMany({
      where: { tabId },
      orderBy: { orderIndex: "asc" },
      include: {
        fields: { orderBy: { orderIndex: "asc" } },
      },
    });

    return NextResponse.json(
      new ApiResponse(200, "SubTabs fetched successfully", subTabs, true),
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      new ApiResponse(500, "Internal server error", "", false),
      { status: 500 }
    );
  }
}
