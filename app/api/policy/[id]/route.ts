import { deletePolicyById, getPolicyById, updatePolicyById } from "@/controller/policy.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest,NextResponse } from "next/server";
import { assertMakerForPolicyEdit, getUserFromRequest } from "@/lib/adminAuth";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
){
    try {
        const { id } =  await params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Policy ID is missing" },
                { status: 400 }
            );
        }
        
        const policy = await getPolicyById(id);

        return NextResponse.json(
            new ApiResponse(200,"Fetched policy with id successfully",policy,true),
            {status:200}
        )
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(error?.statusCode || 500, error?.message || "Internal server error", "", false),
            {status:error?.statusCode || 500}
        )
    }
}


export async function PATCH(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userData = getUserFromRequest(req);
        assertMakerForPolicyEdit(userData.role);

        const body = await req.json();

        const result = await updatePolicyById(id, body, userData);

        return NextResponse.json(
            new ApiResponse(200, "Policy updated successfully", result, true),
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            new ApiResponse(error?.statusCode || 500, error?.message || "Internal server error", "", false),
            {status:error?.statusCode || 500}
        )
    }
}

export async function DELETE(req:NextRequest,{params}:{params: Promise<{id:string}>}) {
    try {
        const {id} = await params;
        const userData = getUserFromRequest(req);
        assertMakerForPolicyEdit(userData.role);

         await  deletePolicyById(id, userData);


        return NextResponse.json(
            new ApiResponse(200,"Policy deleted successfully","",true,),
            { status: 200 }
        )

        
    } catch (error:any) {
        return NextResponse.json(
            new ApiResponse(error?.statusCode || 500, error?.message || "Internal server error", "", false),
            {status:error?.statusCode || 500}
        )   
    }
}
