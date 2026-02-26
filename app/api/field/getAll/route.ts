import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/utils/ApiResponce";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get("policyId");

    if (!policyId) {
      return NextResponse.json(
        new ApiResponse(400, "Policy ID is required", null, false),
        { status: 400 }
      );
    }

    const tabs = await prisma.tab.findMany({
      where: { policyEngineId: policyId },
      include: {
        subTabs: {
          include: {
            fields: true,
          },
        },
      },
      orderBy: { orderIndex: "asc" },
    });

    const fields = tabs.flatMap((tab) =>
      tab.subTabs.flatMap((subTab) =>
        subTab.fields.map((field) => ({
          id: field.id,
          fieldName: field.fieldName,
          fieldType: field.fieldType,
          tabName: tab.name,
          subTabName: subTab.name,
        }))
      )
    );

    return NextResponse.json(new ApiResponse(200, "Fields fetched successfully", fields, true));
  } catch (error: any) {
    return NextResponse.json(
      new ApiResponse(500, error.message || "Failed to fetch fields", null, false),
      { status: 500 }
    );
  }
}
