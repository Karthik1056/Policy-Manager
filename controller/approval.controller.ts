import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import asyncHandler from "@/utils/AsyncHandlerService";

export const submitToQueue = asyncHandler(async (policyId: string, userData?: { name?: string }) => {
    const policy = await prisma.policyEngine.findUnique({ where: { id: policyId } });
    if (!policy) throw new ApiError(404, "Policy not found");

    const queueEntry = await prisma.approvalQueue.create({
        data: {
            policyEngineId: policyId,
            currentLevel: "LEVEL_1_REVIEW",
            notes: "Initial submission for approval"
        }
    });

    await prisma.auditLog.create({
        data: {
            policyEngineId: policyId,
            action: "SUBMITTED",
            details: "Policy submitted to Approval Queue",
            performedBy: userData?.name || "SYSTEM"
        }
    });

    return queueEntry;
});

export const simulatePolicyLogic = asyncHandler(async (policyId: string, testData: any) => {
    const policy = await prisma.policyEngine.findUnique({
        where: { id: policyId },
        include: { tabs: { include: { subTabs: { include: { fields: true } } } } }
    });

    if (!policy) throw new ApiError(404, "Policy not found");

    const allFields = policy.tabs.flatMap(t => t.subTabs.flatMap(st => st.fields));

    const results = allFields.map(field => {
        const input = testData[field.fieldName];
        let status = "PASS";

        if (field.operator === ">=" && !(Number(input) >= Number(field.thresholdValue))) status = "KNOCKOUT";
        if (field.operator === "<" && !(Number(input) < Number(field.thresholdValue))) status = "KNOCKOUT";
        if (field.operator === "==" && input != field.thresholdValue) status = "KNOCKOUT";

        return {
            ruleName: field.fieldName,
            status,
            inputValue: String(input || "N/A"),
            thresholdUsed: `${field.operator} ${field.thresholdValue}`
        };
    });

    const queue = await prisma.approvalQueue.findUnique({ where: { policyEngineId: policyId } });
    if (queue) {
        await prisma.executionLog.createMany({
            data: results.map(r => ({ ...r, approvalQueueId: queue.id }))
        });
    }

    return results;
});

export const approveAndPublish = asyncHandler(async (policyId: string, userData?: { name?: string }) => {
    const policy = await prisma.policyEngine.findUnique({
        where: { id: policyId },
        include: { tabs: { include: { subTabs: { include: { fields: true } } } } }
    });
    if (!policy) throw new ApiError(404, "Policy not found");

    await prisma.policyVersion.create({
        data: {
            versionNumber: policy.version,
            policyEngineId: policyId,
            snapshotData: policy as any
        }
    });

    const publishedPolicy = await prisma.policyEngine.update({
        where: { id: policyId },
        data: { status: "PUBLISHED" }
    });

    const approvalQueueEntry = await prisma.approvalQueue.findUnique({ where: { policyEngineId: policyId } });
    if (approvalQueueEntry) {
        await prisma.approvalQueue.delete({ where: { policyEngineId: policyId } });
    }


    await prisma.auditLog.create({
        data: {
            policyEngineId: policyId,
            action: "APPROVED",
            details: `Policy published by ${userData?.name || 'SYSTEM'}`,
            performedBy: userData?.name || "SYSTEM"
        }
    });

    return publishedPolicy;
});