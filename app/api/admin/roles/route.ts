import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ensureAdminWorkflowTables } from "@/lib/adminWorkflowStore";
import { assertAnyAdmin, assertTechnicalAdmin, getUserFromRequest } from "@/lib/adminAuth";
import { ApiResponse } from "@/utils/ApiResponce";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    assertAnyAdmin(user.role);
    await ensureAdminWorkflowTables();

    const roles = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; description: string | null; created_at: string }>>(
      `SELECT id, name, description, created_at FROM role_definitions ORDER BY created_at DESC`
    );

    return NextResponse.json(new ApiResponse(200, "Roles fetched", roles, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(403, error.message || "Forbidden", "", false), { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    assertTechnicalAdmin(user.role);
    await ensureAdminWorkflowTables();

    const { name, description } = await req.json();
    if (!name) return NextResponse.json(new ApiResponse(400, "Role name required", "", false), { status: 400 });

    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO role_definitions (id, name, description) VALUES ($1, $2, $3)`,
      id,
      String(name).toUpperCase(),
      description || null
    );

    return NextResponse.json(new ApiResponse(201, "Role created", { id, name: String(name).toUpperCase(), description: description || null }, true), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(500, error.message || "Failed to create role", "", false), { status: 500 });
  }
}
