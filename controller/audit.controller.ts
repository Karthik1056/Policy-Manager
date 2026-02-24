import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import asyncHandler from "@/utils/AsyncHandlerService";

export const createAuditLog = asyncHandler(async (policyEngineId: string, action: string, performedBy: string, details?: string) => {
    if (!policyEngineId || !action || !performedBy) {
        throw new ApiError(400, "Required fields are missing");
    }

    const auditLog = await prisma.auditLog.create({
        data: {
            policyEngineId,
            action,
            performedBy,
            details
        }
    });

    return auditLog;
});

export const getAuditLogsByPolicy = asyncHandler(async (policyEngineId: string) => {
    if (!policyEngineId) {
        throw new ApiError(400, "Policy ID is required");
    }

    const logs = await prisma.auditLog.findMany({
        where: { policyEngineId },
        orderBy: { createdAt: 'desc' }
    });

    return logs;
});

export const getAllAuditLogs = asyncHandler(async () => {
    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            policy: {
                select: {
                    name: true,
                    product: true
                }
            }
        }
    });

    return logs;
});




