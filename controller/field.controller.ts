import { fieldInterface } from "@/interface/interface";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import asyncHandler from "@/utils/AsyncHandlerService";


async function getPolicyIdBySubTab(subTabId: string) {
    const subTab = await prisma.subTab.findUnique({
        where: { id: subTabId },
        include: {
            tab: {
                select: { policyEngineId: true }
            }
        }
    });
    return subTab?.tab.policyEngineId;
}

export const createField = asyncHandler(async (data: fieldInterface, userData?: { name?: string }) => {
    const { 
        fieldName, fieldType, operator, thresholdValue, 
        weightage, fieldValues, rules, documentNotes, 
        orderIndex, subTabId 
    } = data;

    if (!fieldName || !fieldType || orderIndex === undefined || !subTabId) {
        throw new ApiError(400, "Required fields are missing");
    }

    const existingSubTab = await prisma.subTab.findUnique({
        where: { id: subTabId },
        include: { tab: true }
    });

    if (!existingSubTab) {
        throw new ApiError(404, "SubTab not found");
    }

    const createdField = await prisma.field.create({
        data: {
            fieldName,
            fieldType,
            operator,
            thresholdValue,
            weightage,
            fieldValues: typeof fieldValues === 'object' ? JSON.stringify(fieldValues) : fieldValues,
            rules: typeof rules === 'object' ? JSON.stringify(rules) : rules,
            documentNotes,
            orderIndex,
            subTabId
        }
    });

    const policyId = await getPolicyIdBySubTab(subTabId);
    if (policyId) {
        await prisma.auditLog.create({
            data: {
                policyEngineId: policyId,
                action: "UPDATED",
                details: `Added new rule: ${fieldName} (${operator} ${thresholdValue})`,
                performedBy: userData?.name || "SYSTEM"
            }
        });
    }

    return createdField;
});

export const updateField = asyncHandler(async (
    id: string,
    data: Partial<fieldInterface>,
    userData?: { name?: string }
) => {
    if (!id) throw new ApiError(400, "Field Id is required");

    const existingField = await prisma.field.findUnique({
        where: { id },
        include: { subTab: { include: { tab: true } } }
    });

    if (!existingField) throw new ApiError(404, "Field not found");

    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => 
            value !== undefined && !["id", "subTabId"].includes(key)
        )
    );

    if (Object.keys(filteredData).length === 0) {
        return existingField;
    }

    const updatedField = await prisma.field.update({
        where: { id },
        data: {
            ...filteredData,
            fieldValues: typeof data.fieldValues === 'object' ? JSON.stringify(data.fieldValues) : data.fieldValues,
            rules: typeof data.rules === 'object' ? JSON.stringify(data.rules) : data.rules,
        }
    });

    await prisma.auditLog.create({
        data: {
            policyEngineId: existingField.subTab.tab.policyEngineId,
            action: "UPDATED",
            details: `Modified rule ${existingField.fieldName}. Updated: ${Object.keys(filteredData).join(", ")}`,
            performedBy: userData?.name || "SYSTEM"
        }
    });

    return updatedField;
});

export const deleteField = asyncHandler(async (id: string, userData?: { name?: string }) => {
    if (!id) throw new ApiError(400, "Field Id is required");

    const existingField = await prisma.field.findUnique({
        where: { id },
        include: { subTab: { include: { tab: true } } }
    });

    if (!existingField) throw new ApiError(404, "Field not found");

    const policyId = existingField.subTab.tab.policyEngineId;

    await prisma.field.delete({ where: { id } });

    await prisma.auditLog.create({
        data: {
            policyEngineId: policyId,
            action: "UPDATED",
            details: `Deleted rule field: ${existingField.fieldName}`,
            performedBy: userData?.name || "SYSTEM"
        }
    });

    return { message: "Field deleted successfully" };
});
