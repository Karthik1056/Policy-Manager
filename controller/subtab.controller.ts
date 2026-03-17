import { subTabInterface } from "@/interface/interface";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import asyncHandler from "@/utils/AsyncHandlerService";

export const createSubTab = asyncHandler(async (data: subTabInterface, userData?: { name?: string }) => {
	const { name, orderIndex, tabId, documentNotes, displayMode } = data;

	if (!name || orderIndex === undefined || !tabId) {
		throw new ApiError(400, "All fields are required");
	}

	const existingTab = await prisma.tab.findUnique({
		where: { id: tabId }
	});

	if (!existingTab) {
		throw new ApiError(404, "Tab not found");
	}

	const createdSubTab = await prisma.subTab.create({
		data: {
			name,
			orderIndex,
			documentNotes: documentNotes ?? null,
			displayMode: displayMode ?? "document",
			tabId
		}
	});

	await prisma.auditLog.create({
		data: {
			policyEngineId: existingTab.policyEngineId,
			action: "UPDATED",
			details: `SubTab created: ${name}`,
			performedBy: userData?.name || "SYSTEM",
		}
	});

	return createdSubTab;
});

export const getSubTabById = asyncHandler(async (id: string) => {
	if (!id) {
		throw new ApiError(400, "SubTab Id is required");
	}

	const subTab = await prisma.subTab.findUnique({
		where: { id },
		include: {
			fields: {
				orderBy: { orderIndex: "asc" }
			}
		}
	});

	if (!subTab) {
		throw new ApiError(404, "SubTab not found");
	}

	return subTab;
});

export const getSubTabsByTabId = asyncHandler(async (tabId: string) => {
	if (!tabId) {
		throw new ApiError(400, "Tab Id is required");
	}

	const existingTab = await prisma.tab.findUnique({
		where: { id: tabId }
	});

	if (!existingTab) {
		throw new ApiError(404, "Tab not found");
	}

	const subTabs = await prisma.subTab.findMany({
		where: { tabId },
		orderBy: { orderIndex: "asc" }
	});

	return subTabs;
});

export const updateSubTab = asyncHandler(async (id: string, data: Partial<subTabInterface>, userData?: { name?: string }) => {
	if (!id) {
		throw new ApiError(400, "SubTab Id is required");
	}

	const existingSubTab = await prisma.subTab.findUnique({
		where: { id },
		include: { tab: true }
	});

	if (!existingSubTab) {
		throw new ApiError(404, "SubTab not found");
	}

	if (!data) {
		throw new ApiError(400, "Data is required");
	}

	const filteredData = Object.fromEntries(
		Object.entries(data).filter(([, value]) => value !== null && value !== undefined)
	);

	if (Object.keys(filteredData).length === 0) {
		return existingSubTab;
	}

	if (filteredData.tabId) {
		const existingTab = await prisma.tab.findUnique({
			where: { id: String(filteredData.tabId) }
		});

		if (!existingTab) {
			throw new ApiError(404, "Tab not found");
		}
	}

	const updatedSubTab = await prisma.subTab.update({
		where: { id },
		data: {
			...filteredData
		}
	});

	await prisma.auditLog.create({
		data: {
			policyEngineId: existingSubTab.tab.policyEngineId,
			action: "UPDATED",
			details: `SubTab updated: ${existingSubTab.name}. Fields: ${Object.keys(filteredData).join(", ")}`,
			performedBy: userData?.name || "SYSTEM",
		}
	});

	return updatedSubTab;
});

export const deleteSubTab = asyncHandler(async (id: string, userData?: { name?: string }) => {
	if (!id) {
		throw new ApiError(400, "SubTab Id is required");
	}

	const existingSubTab = await prisma.subTab.findUnique({
		where: { id },
		include: { tab: true }
	});

	if (!existingSubTab) {
		throw new ApiError(404, "SubTab not found");
	}

	await prisma.subTab.delete({
		where: { id }
	});

	await prisma.auditLog.create({
		data: {
			policyEngineId: existingSubTab.tab.policyEngineId,
			action: "UPDATED",
			details: `SubTab deleted: ${existingSubTab.name}`,
			performedBy: userData?.name || "SYSTEM",
		}
	});

	return { message: "SubTab deleted successfully" };
});
