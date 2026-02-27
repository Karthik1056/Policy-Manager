import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import asyncHandler from "@/utils/AsyncHandlerService";
import { ensureAdminWorkflowTables } from "@/lib/adminWorkflowStore";
import { randomUUID } from "crypto";

function parseJson(value: string | null): Record<string, any> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function valueInList(target: string, expected: unknown): boolean {
  if (Array.isArray(expected)) {
    return expected.map((v) => String(v).toLowerCase()).includes(target.toLowerCase());
  }
  if (typeof expected === "string") {
    return target.toLowerCase() === expected.toLowerCase();
  }
  return false;
}

function evaluateStepCondition(conditionJson: string | null, policy: { product: string; status: string; name: string; version: string }): boolean {
  const condition = parseJson(conditionJson);
  if (!condition) return true;

  if (condition.enabled === false) return false;
  if (condition.productEquals && !valueInList(policy.product || "", condition.productEquals)) return false;
  if (condition.statusEquals && !valueInList(policy.status || "", condition.statusEquals)) return false;
  if (condition.versionEquals && !valueInList(policy.version || "", condition.versionEquals)) return false;
  if (typeof condition.nameIncludes === "string") {
    if (!String(policy.name || "").toLowerCase().includes(condition.nameIncludes.toLowerCase())) return false;
  }

  return true;
}

export const submitToQueue = asyncHandler(async (policyId: string, userData?: { name?: string }) => {
  const policy = await prisma.policyEngine.findUnique({ where: { id: policyId } });
  if (!policy) throw new ApiError(404, "Policy not found");

  await ensureAdminWorkflowTables();

  const queueEntry = await prisma.approvalQueue.create({
    data: {
      policyEngineId: policyId,
      currentLevel: "LEVEL_1_REVIEW",
      notes: "Initial submission for approval",
    },
  });

  const mappedWorkflow = await prisma.$queryRawUnsafe<Array<{ workflow_id: string }>>(
    `SELECT workflow_id FROM policy_workflow_map WHERE policy_id = $1 LIMIT 1`,
    policyId
  );

  if (mappedWorkflow.length > 0) {
    const workflowId = mappedWorkflow[0].workflow_id;
    const steps = await prisma.$queryRawUnsafe<Array<any>>(
      `SELECT id, step_order, approval_mode, required_approvals, user_ids, role_name, sla_hours, condition_json, step_name
       FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order ASC`,
      workflowId
    );

    let createdStepCount = 0;
    for (const step of steps) {
      const shouldRoute = evaluateStepCondition(step.condition_json || null, {
        product: policy.product,
        status: policy.status,
        name: policy.name,
        version: policy.version,
      });

      if (!shouldRoute) {
        continue;
      }

      const parsedUserIds: string[] = step.user_ids ? JSON.parse(step.user_ids) : [];
      const dueAt = new Date(Date.now() + Number(step.sla_hours || 24) * 60 * 60 * 1000);
      const approvalMode = String(step.approval_mode || "SEQUENTIAL").toUpperCase();

      if (approvalMode === "PARALLEL" || approvalMode === "COMMITTEE") {
        if (parsedUserIds.length > 0) {
          for (const userId of parsedUserIds) {
            await prisma.$executeRawUnsafe(
              `INSERT INTO approval_instances
               (id, policy_id, workflow_id, step_id, assigned_user_id, committee_group, status, started_at, due_at)
               VALUES ($1,$2,$3,$4,$5,$6,'PENDING',NOW(),$7)`,
              randomUUID(),
              policyId,
              workflowId,
              step.id,
              userId,
              approvalMode === "COMMITTEE" ? step.role_name || "COMMITTEE" : null,
              dueAt
            );
            createdStepCount += 1;
          }
        }
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO approval_instances
           (id, policy_id, workflow_id, step_id, assigned_user_id, status, started_at, due_at)
           VALUES ($1,$2,$3,$4,$5,'PENDING',NOW(),$6)`,
          randomUUID(),
          policyId,
          workflowId,
          step.id,
          parsedUserIds[0] || null,
          dueAt
        );
        createdStepCount += 1;
      }
    }

    await prisma.approvalQueue.update({
      where: { id: queueEntry.id },
      data: {
        currentLevel: `WORKFLOW:${workflowId}`,
        notes: `Workflow routing active (${createdStepCount} routed approvals)`,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      policyEngineId: policyId,
      action: "SUBMITTED",
      details: "Policy submitted to Approval Queue",
      performedBy: userData?.name || "SYSTEM",
    },
  });

  return queueEntry;
});

export const simulatePolicyLogic = asyncHandler(async (policyId: string, testData: any) => {
  const policy = await prisma.policyEngine.findUnique({
    where: { id: policyId },
    include: { tabs: { include: { subTabs: { include: { fields: true } } } } },
  });

  if (!policy) throw new ApiError(404, "Policy not found");

  const allFields = policy.tabs.flatMap((t) => t.subTabs.flatMap((st) => st.fields));

  const results = allFields.map((field) => {
    const input = testData[field.fieldName];
    let status = "PASS";

    if (field.operator === ">=" && !(Number(input) >= Number(field.thresholdValue))) status = "KNOCKOUT";
    if (field.operator === "<" && !(Number(input) < Number(field.thresholdValue))) status = "KNOCKOUT";
    if (field.operator === "==" && input != field.thresholdValue) status = "KNOCKOUT";

    return {
      ruleName: field.fieldName,
      status,
      inputValue: String(input || "N/A"),
      thresholdUsed: `${field.operator} ${field.thresholdValue}`,
    };
  });

  const queue = await prisma.approvalQueue.findUnique({ where: { policyEngineId: policyId } });
  if (queue) {
    await prisma.executionLog.createMany({
      data: results.map((r) => ({ ...r, approvalQueueId: queue.id })),
    });
  }

  return results;
});

export const approveAndPublish = asyncHandler(async (policyId: string, userData?: { name?: string }) => {
  const policy = await prisma.policyEngine.findUnique({
    where: { id: policyId },
    include: { tabs: { include: { subTabs: { include: { fields: true } } } } },
  });
  if (!policy) throw new ApiError(404, "Policy not found");

  await prisma.policyVersion.create({
    data: {
      versionNumber: policy.version,
      policyEngineId: policyId,
      snapshotData: policy as any,
    },
  });

  const publishedPolicy = await prisma.policyEngine.update({
    where: { id: policyId },
    data: { status: "PUBLISHED" },
  });

  const approvalQueueEntry = await prisma.approvalQueue.findUnique({ where: { policyEngineId: policyId } });
  if (approvalQueueEntry) {
    await prisma.approvalQueue.delete({ where: { policyEngineId: policyId } });
  }

  await prisma.auditLog.create({
    data: {
      policyEngineId: policyId,
      action: "APPROVED",
      details: `Policy published by ${userData?.name || "SYSTEM"}`,
      performedBy: userData?.name || "SYSTEM",
    },
  });

  return publishedPolicy;
});
