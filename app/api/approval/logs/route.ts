import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const logs = await prisma.approvalLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        policy: {
          select: {
            name: true,
            version: true,
          },
        },
        checker: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      policyId: log.policyId,
      policyName: log.policy.name,
      policyVersion: log.policy.version,
      decision: log.decision,
      notes: log.notes,
      checkerName: log.checker.name,
      checkerEmail: log.checker.email,
      createdAt: log.createdAt,
    }));

    return NextResponse.json(
      new ApiResponse(200, "Execution logs fetched successfully", formattedLogs, true),
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      new ApiResponse(500, "Internal server error", "", false),
      { status: 500 }
    );
  }
}
