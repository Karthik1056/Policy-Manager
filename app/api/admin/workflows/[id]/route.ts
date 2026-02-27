import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ensureAdminWorkflowTables } from "@/lib/adminWorkflowStore";
import { assertPolicyAdmin, getUserFromRequest } from "@/lib/adminAuth";
import { ApiResponse } from "@/utils/ApiResponce";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    assertPolicyAdmin(user.role);
    await ensureAdminWorkflowTables();
    const { id } = await params;

    const { name, flowType, orgUnitId, slaHours, isActive, steps } = await req.json();

    await prisma.$executeRawUnsafe(
      `UPDATE workflow_definitions
       SET name = COALESCE($2, name),
           flow_type = COALESCE($3, flow_type),
           org_unit_id = COALESCE($4, org_unit_id),
           sla_hours = COALESCE($5, sla_hours),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $1`,
      id,
      name || null,
      flowType ? String(flowType).toUpperCase() : null,
      orgUnitId || null,
      slaHours ? Number(slaHours) : null,
      typeof isActive === "boolean" ? isActive : null
    );

    if (Array.isArray(steps)) {
      await prisma.$executeRawUnsafe(`DELETE FROM workflow_steps WHERE workflow_id = $1`, id);
      for (let i = 0; i < steps.length; i += 1) {
        const s = steps[i];
        await prisma.$executeRawUnsafe(
          `INSERT INTO workflow_steps
           (id, workflow_id, step_order, step_name, approval_mode, required_approvals, role_name, user_ids, condition_json, sla_hours)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          randomUUID(),
          id,
          Number(s.stepOrder || i + 1),
          s.stepName || `Step ${i + 1}`,
          String(s.approvalMode || "SEQUENTIAL").toUpperCase(),
          Number(s.requiredApprovals || 1),
          s.roleName || null,
          s.userIds ? JSON.stringify(s.userIds) : null,
          s.conditionJson ? JSON.stringify(s.conditionJson) : null,
          Number(s.slaHours || 24)
        );
      }
    }

    return NextResponse.json(new ApiResponse(200, "Workflow updated", { id }, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(500, error.message || "Failed to update workflow", "", false), { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    assertPolicyAdmin(user.role);
    await ensureAdminWorkflowTables();
    const { id } = await params;

    await prisma.$executeRawUnsafe(`DELETE FROM workflow_steps WHERE workflow_id = $1`, id);
    await prisma.$executeRawUnsafe(`DELETE FROM policy_workflow_map WHERE workflow_id = $1`, id);
    await prisma.$executeRawUnsafe(`DELETE FROM workflow_definitions WHERE id = $1`, id);

    return NextResponse.json(new ApiResponse(200, "Workflow deleted", { id }, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(500, error.message || "Failed to delete workflow", "", false), { status: 500 });
  }
}
