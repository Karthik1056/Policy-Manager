import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAdminWorkflowTables } from "@/lib/adminWorkflowStore";
import { assertPolicyAdmin, getUserFromRequest } from "@/lib/adminAuth";
import { ApiResponse } from "@/utils/ApiResponce";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    assertPolicyAdmin(user.role);
    await ensureAdminWorkflowTables();

    const rows = await prisma.$queryRawUnsafe<Array<{
      id: string;
      policy_id: string;
      workflow_id: string;
      step_id: string;
      assigned_user_id: string | null;
      committee_group: string | null;
      status: string;
      due_at: Date | null;
      is_overdue: boolean;
    }>>(
      `SELECT id, policy_id, workflow_id, step_id, assigned_user_id, committee_group, status, due_at,
              (status = 'PENDING' AND due_at IS NOT NULL AND due_at < NOW()) AS is_overdue
       FROM approval_instances
       ORDER BY started_at DESC`
    );

    return NextResponse.json(new ApiResponse(200, "Approval instances fetched", rows, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(403, error.message || "Forbidden", "", false), { status: 403 });
  }
}
