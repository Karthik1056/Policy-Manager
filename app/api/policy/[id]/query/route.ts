import { NextRequest, NextResponse } from "next/server";
import { queryPolicy } from "@/controller/query.controller";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { query } = body;
        
        if (!query) {
            return NextResponse.json(
                { success: false, message: "Query is required", data: null },
                { status: 400 }
            );
        }

        const result = await queryPolicy(id, query);
        return NextResponse.json(
            { success: true, data: result, message: "Query evaluated successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Query error:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to evaluate query", data: null },
            { status: 500 }
        );
    }
}
