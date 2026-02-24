import { TabInterface } from "@/interface/interface";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import asyncHandler from "@/utils/AsyncHandlerService";

export const createTab = asyncHandler(async(data:TabInterface) => {
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

    return createTab;
})

export const updateTab = asyncHandler(async(id:string, data:Partial<TabInterface>) => {
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
    
    const updateTab = await prisma.tab.update({
        where:{id},
        data:{
            ...filteredData
        }
    })

    return updateTab;
})

export const deleteTab = asyncHandler(async(id:string) => {
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

    return {message:"Tab deleted successfully"}
})
