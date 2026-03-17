export interface UserInterface {
    id : string;
    name : string;
    email : string;
    role: string;
    password: string;
    createdAt: Date;
}

export interface ApiError extends Error {
    statusCode: number;
    data: null;
    success: boolean;
    errors: any[];
}

export interface ApiResponse {
    statusCode: number;
    message: string;
    data: any;
    success: boolean;
}



export interface PolicyInterface {
    id:string;
    name: string;
    product:string;
    status:string;
    version:string;
    startDate:Date;
    description?:string | null;
    dynamicFields?: Record<string, any> | null;
    makerId:string;
    checkerId?:string | null;
    createdAt:Date;
    updatedAt:Date;
}

export interface TabInterface{
    id:string;
    name:string;
    orderIndex:number;
    documentNotes?:string | null;
    policyEngineId:string;
}

export interface subTabInterface{
    id : string;
    name: string;
    orderIndex : number;
    documentNotes?: string | null;
    displayMode?: string | null;
    tabId : string;
}

export interface fieldInterface{
    id: string;
    fieldName:string;
    fieldType:string;
    operator?:string | null;
    thresholdValue?:string | null;
    weightage?:number | null;
    fieldValues?:string | null;
    rules?:string | null;
    documentNotes?: string | null;
    orderIndex : number;
    subTabId: string;
}
