import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/utils/ApiResponce";
import { ensureAdminWorkflowTables } from "@/lib/adminWorkflowStore";
import { assertPolicyAdmin, getUserFromRequest } from "@/lib/adminAuth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureAdminWorkflowTables();

    const rows = await prisma.$queryRawUnsafe<Array<{
      id: string;
      policy_id: string;
      commenter_id: string;
      commenter_name: string | null;
      comment_text: string;
      created_at: string;
    }>>(
      `SELECT id, policy_id, commenter_id, commenter_name, comment_text, created_at
       FROM policy_comments
       WHERE policy_id = $1
       ORDER BY created_at DESC`,
      id
    );

    return NextResponse.json(new ApiResponse(200, "Policy comments fetched", rows, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(500, error?.message || "Failed to fetch comments", "", false), { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    assertPolicyAdmin(user.role);
    await ensureAdminWorkflowTables();

    const { id } = await params;
    const { comment } = await req.json();

    if (!comment || !String(comment).trim()) {
      return NextResponse.json(new ApiResponse(400, "Comment is required", "", false), { status: 400 });
    }

    const commentId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO policy_comments (id, policy_id, commenter_id, commenter_name, comment_text)
       VALUES ($1, $2, $3, $4, $5)`,
      commentId,
      id,
      user.id,
      user.name || "ADMIN",
      String(comment).trim()
    );

    return NextResponse.json(new ApiResponse(201, "Comment added", { id: commentId }, true), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(403, error?.message || "Forbidden", "", false), { status: 403 });
  }
}
