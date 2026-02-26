import { NextRequest, NextResponse } from "next/server";
import { LoginUser } from "@/controller/user.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { ApiError } from "@/utils/ApiError";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { returnUser, accessToken } = await LoginUser(body);
        
        const response = NextResponse.json(
            new ApiResponse(200, "Login successful", { user: returnUser, accessToken }, true),
            { status: 200 }
        );

        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });

        return response;
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return NextResponse.json(
                new ApiResponse(error.statusCode, error.message, "", false),
                { status: error.statusCode }
            );
        }
        return NextResponse.json(
            new ApiResponse(500,"Internal server error","",false),
            {status:500}
        )
    }
}
