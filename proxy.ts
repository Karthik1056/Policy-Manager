import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose"; 

export async function proxy(request: NextRequest) {
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
        return NextResponse.json(
            { message: "No token provided. Please log in." },
            { status: 401 }
        );
    }

    try {
        const secret = new TextEncoder().encode(process.env.MY_SECRET_KEY);
        
        const { payload } = await jose.jwtVerify(token, secret);

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-data", JSON.stringify(payload));
        
        const response = NextResponse.next({
            request: { headers: requestHeaders },
        });

        return response;
    } catch (error) {
        console.error("Token verification error:", error);
        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}

export const config = {
    matcher: ["/api/((?!users/login|users/signup).*)"],
};