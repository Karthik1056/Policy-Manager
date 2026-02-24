import { deletePolicyById, getPolicyById, updatePolicyById } from "@/controller/policy.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest,NextResponse } from "next/server";

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
        const userDataHeader = req.headers.get("x-user-data");
        const userData = userDataHeader ? JSON.parse(userDataHeader) : undefined;

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


        const userData = req.headers.get("x-user-data");

        if (!userData) {
            return NextResponse.json(
                { success: false, message: "User data is missing" },
                { status: 400 }
            );
        }

         await  deletePolicyById(id,JSON.parse(userData));


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