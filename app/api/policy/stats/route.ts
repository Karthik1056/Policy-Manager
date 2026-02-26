import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const [total, inReview, published] = await Promise.all([
      prisma.policyEngine.count(),
      prisma.policyEngine.count({ where: { status: "DRAFT" } }),
      prisma.policyEngine.count({ where: { status: "PUBLISHED" } }),
    ]);

    const stats = { total, inReview, published };

    return NextResponse.json(
      new ApiResponse(200, "Stats fetched successfully", stats, true),
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      new ApiResponse(500, "Internal server error", "", false),
      { status: 500 }
    );
  }
}
