import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ensureAdminWorkflowTables } from "@/lib/adminWorkflowStore";
import { assertPolicyAdmin, getUserFromRequest } from "@/lib/adminAuth";
import { ApiResponse } from "@/utils/ApiResponce";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    assertPolicyAdmin(user.role);
    await ensureAdminWorkflowTables();

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; policy_id: string; user_id: string; access_type: string; created_at: string }>>(
      `SELECT id, policy_id, user_id, access_type, created_at FROM policy_user_access ORDER BY created_at DESC`
    );

    return NextResponse.json(new ApiResponse(200, "Policy access fetched", rows, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(403, error.message || "Forbidden", "", false), { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    assertPolicyAdmin(user.role);
    await ensureAdminWorkflowTables();

    const { policyId, userId, accessType } = await req.json();
    if (!policyId || !userId) {
      return NextResponse.json(new ApiResponse(400, "policyId and userId required", "", false), { status: 400 });
    }

    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO policy_user_access (id, policy_id, user_id, access_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (policy_id, user_id) DO UPDATE SET access_type = EXCLUDED.access_type`,
      id,
      policyId,
      userId,
      accessType || "VIEW"
    );

    return NextResponse.json(new ApiResponse(201, "Policy access assigned", { policyId, userId, accessType: accessType || "VIEW" }, true), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(500, error.message || "Failed to assign policy access", "", false), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    assertPolicyAdmin(user.role);
    await ensureAdminWorkflowTables();

    const { searchParams } = new URL(req.url);
    const policyId = searchParams.get("policyId");
    const userId = searchParams.get("userId");
    if (!policyId || !userId) {
      return NextResponse.json(new ApiResponse(400, "policyId and userId required", "", false), { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM policy_user_access WHERE policy_id = $1 AND user_id = $2`,
      policyId,
      userId
    );

    return NextResponse.json(new ApiResponse(200, "Policy access removed", { policyId, userId }, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(500, error.message || "Failed to remove policy access", "", false), { status: 500 });
  }
}
