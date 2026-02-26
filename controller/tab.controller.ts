import { TabInterface } from "@/interface/interface";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import asyncHandler from "@/utils/AsyncHandlerService";

export const createTab = asyncHandler(async(data:TabInterface, userData?: { name?: string }) => {
    const {name,orderIndex,policyEngineId} = data;

    if(!name || orderIndex === undefined || !policyEngineId){
        throw new ApiError(400,"All fields are required")
    }

    const createTab = await prisma.tab.create(
        {
            data:{
                name,
                orderIndex,
                policyEngineId
            }
        }
    )

    await prisma.auditLog.create({
        data: {
            policyEngineId,
            action: "UPDATED",
            details: `Tab created: ${name}`,
            performedBy: userData?.name || "SYSTEM",
        }
    });

    return createTab;
})

export const updateTab = asyncHandler(async(id:string, data:Partial<TabInterface>, userData?: { name?: string }) => {
    if(!id){
        throw new ApiError(400,"Tab Id is required")
    }

    const tab = await prisma.tab.findUnique({
        where:{id}
    })
    
    if(!tab){
        throw new ApiError(404,"Tab not found")
    }
    
    if(!data){
        throw new ApiError(400, "Data is required")
    }
    
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([key,value])=> 
            value !== null &&
            value !== undefined
        )
    )

    if (Object.keys(filteredData).length === 0) {
        return tab;
    }

    const updateTab = await prisma.tab.update({
        where:{id},
        data:{
            ...filteredData
        }
    })

    await prisma.auditLog.create({
        data: {
            policyEngineId: tab.policyEngineId,
            action: "UPDATED",
            details: `Tab updated: ${tab.name}. Fields: ${Object.keys(filteredData).join(", ")}`,
            performedBy: userData?.name || "SYSTEM",
        }
    });

    return updateTab;
})

export const deleteTab = asyncHandler(async(id:string, userData?: { name?: string }) => {
    if(!id){
        throw new ApiError(400, "Tab Id is required")
    }

    const tab = await prisma.tab.findUnique({
        where:{id}
    })

    if(!tab){
        throw new ApiError(404, "Tab not found")
    }

     await prisma.tab.delete({
        where:{id}
    })

    await prisma.auditLog.create({
        data: {
            policyEngineId: tab.policyEngineId,
            action: "UPDATED",
            details: `Tab deleted: ${tab.name}`,
            performedBy: userData?.name || "SYSTEM",
        }
    });

    return {message:"Tab deleted successfully"}
})
