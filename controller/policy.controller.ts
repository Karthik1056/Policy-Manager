import { PolicyInterface } from "@/interface/interface"
import { prisma } from "@/lib/prisma"
import { ApiError } from "@/utils/ApiError"
import asyncHandler from "@/utils/AsyncHandlerService";
import { createPolicySnapshot } from "./snapshot.controller";

export const createPolicy = asyncHandler(async (data: PolicyInterface, userData) => {
    const { name, product, description } = data;
    const status = data.status || "DRAFT";
    const version = data.version || "v1.0";

    const {
        id: _skipId,
        makerId: _skipMakerId,
        checkerId: _skipCheckerId,
        createdAt: _skipCreatedAt,
        updatedAt: _skipUpdatedAt,
        name: _skipName,
        product: _skipProduct,
        status: _skipStatus,
        version: _skipVersion,
        startDate: _skipStartDate,
        description: _skipDescription,
        dynamicFields: incomingDynamicFields,
        ...unknownDynamicFields
    } = (data || {}) as any;

    const normalizedDynamicFields = {
        ...(incomingDynamicFields && typeof incomingDynamicFields === "object" ? incomingDynamicFields : {}),
        ...unknownDynamicFields,
    };

    const hasDynamicFields = Object.keys(normalizedDynamicFields).length > 0;

    if (!name || !product) {
        throw new ApiError(400, "Name and product are required");
    }

    const policy = await prisma.policyEngine.create({
        data: {
            name,
            product,
            status,
            description,
            makerId: userData.id,
            version
        }
    });

    if (hasDynamicFields) {
        await prisma.$executeRawUnsafe(
            'UPDATE "PolicyEngine" SET "dynamicFields" = COALESCE("dynamicFields", \'{}\'::jsonb) || $1::jsonb WHERE "id" = $2',
            JSON.stringify(normalizedDynamicFields),
            policy.id
        );
    }

    await prisma.auditLog.create({
        data: {
            policyEngineId: policy.id,
            action: "CREATED",
            details: `Initial policy ${name} created as ${status}`,
            performedBy: userData.name
        }
    });

    return policy;
});

export const updatePolicyById = asyncHandler(async (
    id: string,
    data: Partial<PolicyInterface>,
    userData?: { name?: string }
) => {
    const existingPolicy = await prisma.policyEngine.findUnique({ where: { id } });
    if (!existingPolicy) throw new ApiError(404, "Policy not found");

    const {
        id: _skipId,
        makerId: _skipMakerId,
        checkerId: _skipCheckerId,
        createdAt: _skipCreatedAt,
        updatedAt: _skipUpdatedAt,
        dynamicFields: incomingDynamicFields,
        ...remaining
    } = (data || {}) as any;

    const scalarAllowedKeys = ["name", "product", "status", "version", "startDate", "description"] as const;
    const scalarUpdates: Record<string, any> = {};
    const unknownDynamicFields: Record<string, any> = {};

    for (const [key, value] of Object.entries(remaining)) {
        if (value === undefined) continue;
        if ((scalarAllowedKeys as readonly string[]).includes(key)) {
            scalarUpdates[key] = value;
        } else {
            unknownDynamicFields[key] = value;
        }
    }

    let mergedDynamicFields: Record<string, any> | null | undefined = undefined;
    const incomingDynamic =
        incomingDynamicFields && typeof incomingDynamicFields === "object"
            ? (incomingDynamicFields as Record<string, any>)
            : {};

    const nextDynamic = {
        ...incomingDynamic,
        ...unknownDynamicFields,
    };

    if (Object.keys(nextDynamic).length > 0) {
        mergedDynamicFields = nextDynamic;
    }

    const filteredData: Record<string, any> = { ...scalarUpdates };

    if (Object.keys(filteredData).length === 0 && mergedDynamicFields === undefined) {
        return existingPolicy;
    }

    const incomingVersion = typeof filteredData["version"] === "string" ? filteredData["version"] : undefined;
    if (incomingVersion && incomingVersion !== existingPolicy.version) {
        await createPolicySnapshot(
            id,
            `version change ${existingPolicy.version} -> ${incomingVersion}`,
            userData,
            { versionNumber: existingPolicy.version }
        );
    }

    const updatedPolicy = Object.keys(filteredData).length > 0
        ? await prisma.policyEngine.update({
            where: { id },
            data: { ...filteredData }
        })
        : existingPolicy;

    if (mergedDynamicFields !== undefined) {
        await prisma.$executeRawUnsafe(
            'UPDATE "PolicyEngine" SET "dynamicFields" = COALESCE("dynamicFields", \'{}\'::jsonb) || $1::jsonb WHERE "id" = $2',
            JSON.stringify(mergedDynamicFields),
            id
        );
    }

    const refreshedPolicy = await prisma.policyEngine.findUnique({ where: { id } });

    await prisma.auditLog.create({
        data: {
            policyEngineId: id,
            action: "UPDATED",
            details: `Fields updated: ${Object.keys(filteredData).join(", ")}`,
            performedBy: userData?.name || "SYSTEM"
        }
    });

    return refreshedPolicy || updatedPolicy;
});

export const getAllPolicies = asyncHandler(async () => {
    const policies = await prisma.policyEngine.findMany({
        include: {
            maker: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            }
        }
    });

    if (!policies || policies.length === 0) {
        throw new ApiError(404, "No policy found");
    }

    return policies;
});


export const getPolicyById = asyncHandler(async (id: string) => {
    const policy = await prisma.policyEngine.findUnique(
        {
            where: { id },
            include: {
                tabs: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        subTabs: {
                            orderBy: { orderIndex: 'asc' },
                            include: {
                                fields: { orderBy: { orderIndex: 'asc' } }
                            }
                        }
                    }
                }
            }
        }
    );

    if (!policy) {
        throw new ApiError(404, "Policy not found");
    }
    return policy;
})


export const deletePolicyById = asyncHandler(async (id: string, userData) => {
    if (!id) {
        throw new ApiError(400, "Policy Id is required");
    }

    const existingPolicy = await prisma.policyEngine.findUnique({
        where: { id }
    });

    if (!existingPolicy) {
        throw new ApiError(404, "Policy not found");
    }

    const role = userData.role;

    // if (role != "senior") {
    //     throw new ApiError(403, "Unauthorized to delete policy");
    // } else {
    // });

    await prisma.policyEngine.delete({
        where: { id }
    })
    return { message: "Policy deleted successfully" };

})


