import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAdminWorkflowTables } from "@/lib/adminWorkflowStore";
import { assertPolicyAdmin, getUserFromRequest } from "@/lib/adminAuth";
import { ApiResponse } from "@/utils/ApiResponce";

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    assertPolicyAdmin(user.role);
    await ensureAdminWorkflowTables();

    const { policyId, workflowId } = await req.json();
    if (!policyId || !workflowId) {
      return NextResponse.json(new ApiResponse(400, "policyId and workflowId required", "", false), { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO policy_workflow_map (policy_id, workflow_id)
       VALUES ($1, $2)
       ON CONFLICT (policy_id) DO UPDATE SET workflow_id = EXCLUDED.workflow_id, mapped_at = NOW()`,
      policyId,
      workflowId
    );

    return NextResponse.json(new ApiResponse(200, "Workflow assigned to policy", { policyId, workflowId }, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(500, error.message || "Failed to assign workflow", "", false), { status: 500 });
  }
}
