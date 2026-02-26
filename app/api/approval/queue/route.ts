import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const queue = await prisma.approvalQueue.findMany({
      where: { currentLevel: "LEVEL_1_REVIEW" },
      include: {
        policyEngine: {
          include: {
            maker: {
              select: {
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      new ApiResponse(200, "Approval queue fetched successfully", queue, true),
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      new ApiResponse(500, "Internal server error", "", false),
      { status: 500 }
    );
  }
}
