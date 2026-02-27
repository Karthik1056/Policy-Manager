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

    const org = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; parent_id: string | null; level: number }>>(
      `SELECT id, name, parent_id, level FROM org_units ORDER BY level ASC, name ASC`
    );

    return NextResponse.json(new ApiResponse(200, "Org structure fetched", org, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(403, error.message || "Forbidden", "", false), { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    assertTechnicalAdmin(user.role);
    await ensureAdminWorkflowTables();

    const { name, parentId, level } = await req.json();
    if (!name) return NextResponse.json(new ApiResponse(400, "name required", "", false), { status: 400 });

    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO org_units (id, name, parent_id, level) VALUES ($1, $2, $3, $4)`,
      id,
      name,
      parentId || null,
      Number(level || 1)
    );

    return NextResponse.json(new ApiResponse(201, "Org unit created", { id, name, parentId: parentId || null, level: Number(level || 1) }, true), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(500, error.message || "Failed to create org unit", "", false), { status: 500 });
  }
}
