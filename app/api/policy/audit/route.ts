import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        policy: {
          select: {
            name: true,
          },
        },
      },
    });

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      policyId: log.policyEngineId,
      policyName: log.policy.name,
      action: log.action,
      changes: log.details,
      userName: log.performedBy,
      userRole: "User",
      createdAt: log.createdAt,
    }));

    return NextResponse.json(
      new ApiResponse(200, "Audit logs fetched successfully", formattedLogs, true),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Audit log error:", error);
    return NextResponse.json(
      new ApiResponse(500, error.message || "Internal server error", [], false),
      { status: 500 }
    );
  }
}
