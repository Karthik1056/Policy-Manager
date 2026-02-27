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

    const workflows = await prisma.$queryRawUnsafe<Array<any>>(
      `SELECT id, name, flow_type, org_unit_id, sla_hours, is_active, created_by, created_at, updated_at
       FROM workflow_definitions ORDER BY created_at DESC`
    );

    const steps = await prisma.$queryRawUnsafe<Array<any>>(
      `SELECT id, workflow_id, step_order, step_name, approval_mode, required_approvals, role_name, user_ids, condition_json, sla_hours
       FROM workflow_steps ORDER BY workflow_id, step_order ASC`
    );

    const byWorkflow = steps.reduce((acc: Record<string, any[]>, step: any) => {
      if (!acc[step.workflow_id]) acc[step.workflow_id] = [];
      acc[step.workflow_id].push(step);
      return acc;
    }, {});

    const enriched = workflows.map((w) => ({ ...w, steps: byWorkflow[w.id] || [] }));

    return NextResponse.json(new ApiResponse(200, "Workflows fetched", enriched, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(403, error.message || "Forbidden", "", false), { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    assertPolicyAdmin(user.role);
    await ensureAdminWorkflowTables();

    const { name, flowType, orgUnitId, slaHours, steps } = await req.json();
    if (!name || !flowType) {
      return NextResponse.json(new ApiResponse(400, "name and flowType required", "", false), { status: 400 });
    }

    const workflowId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO workflow_definitions (id, name, flow_type, org_unit_id, sla_hours, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      workflowId,
      name,
      String(flowType).toUpperCase(),
      orgUnitId || null,
      Number(slaHours || 24),
      user.id
    );

    const workflowSteps = Array.isArray(steps) ? steps : [];
    for (let i = 0; i < workflowSteps.length; i += 1) {
      const s = workflowSteps[i];
      await prisma.$executeRawUnsafe(
        `INSERT INTO workflow_steps
         (id, workflow_id, step_order, step_name, approval_mode, required_approvals, role_name, user_ids, condition_json, sla_hours)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        randomUUID(),
        workflowId,
        Number(s.stepOrder || i + 1),
        s.stepName || `Step ${i + 1}`,
        String(s.approvalMode || "SEQUENTIAL").toUpperCase(),
        Number(s.requiredApprovals || 1),
        s.roleName || null,
        s.userIds ? JSON.stringify(s.userIds) : null,
        s.conditionJson ? JSON.stringify(s.conditionJson) : null,
        Number(s.slaHours || slaHours || 24)
      );
    }

    return NextResponse.json(new ApiResponse(201, "Workflow created", { id: workflowId }, true), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(500, error.message || "Failed to create workflow", "", false), { status: 500 });
  }
}
