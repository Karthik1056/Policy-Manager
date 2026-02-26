import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import asyncHandler from "@/utils/AsyncHandlerService";

export const createPolicyVersion = asyncHandler(async (policyId: string, versionNumber: string, userData: any, changeNote?: string) => {
    const policy = await prisma.policyEngine.findUnique({
        where: { id: policyId },
        include: {
            tabs: {
                include: { subTabs: { include: { fields: true } } }
            }
        }
    });

    if (!policy) throw new ApiError(404, "Policy not found");

    const version = await prisma.policyVersion.create({
        data: {
            versionNumber,
            policyEngineId: policyId,
            snapshotData: policy as any,
            changeNote: changeNote || null
        }
    });

    await prisma.auditLog.create({
        data: {
            policyEngineId: policyId,
            action: "UPDATED",
            details: `Created version snapshot: ${versionNumber}${changeNote ? ` - ${changeNote}` : ""}`,
            performedBy: userData.name
        }
    });

    return version;
});

export const getVersionsByPolicyId = asyncHandler(async (policyId: string) => {
    return await prisma.policyVersion.findMany({
        where: { policyEngineId: policyId },
        orderBy: { createdAt: "desc" }
    });
});