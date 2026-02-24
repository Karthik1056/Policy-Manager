import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextResponse) {
    const userData = req.headers.get('x-user-data');

    if (!userData) {
        return NextResponse.json({ message: "User data not found" }, { status: 400 });
    }

    const user = JSON.parse(userData)
    return NextResponse.json(new ApiResponse(200, "User Fetched successfully",user,true),{status:200}
    );
}