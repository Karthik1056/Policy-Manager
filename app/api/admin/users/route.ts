import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAnyAdmin, assertTechnicalAdmin, getUserFromRequest } from "@/lib/adminAuth";
import { ApiResponse } from "@/utils/ApiResponce";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    // Allow MAKER to fetch users for checker assignment
    if (!['IT_ADMIN', 'ITADMIN', 'POLICY_ADMIN', 'MAKER'].includes(user.role)) {
      throw new Error('Forbidden');
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(new ApiResponse(200, "Users fetched", users, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(403, error.message || "Forbidden", "", false), { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getUserFromRequest(req);
    assertTechnicalAdmin(admin.role);

    const { name, email, role, password } = await req.json();
    if (!name || !email || !role || !password) {
      return NextResponse.json(new ApiResponse(400, "name, email, role, password required", "", false), { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(new ApiResponse(409, "User already exists", "", false), { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        id: randomUUID(),
        name,
        email,
        role: String(role).toUpperCase(),
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json(new ApiResponse(201, "User created", created, true), { status: 201 });
  } catch (error: any) {
    const message = error?.message || "Failed to create user";
    const status = String(message).toLowerCase().includes("forbidden") ? 403 : 500;
    return NextResponse.json(new ApiResponse(status, message, "", false), { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = getUserFromRequest(req);
    assertTechnicalAdmin(admin.role);

    const { id, name, role } = await req.json();
    if (!id) return NextResponse.json(new ApiResponse(400, "id required", "", false), { status: 400 });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(role ? { role: String(role).toUpperCase() } : {}),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json(new ApiResponse(200, "User updated", updated, true), { status: 200 });
  } catch (error: any) {
    const message = error?.message || "Failed to update user";
    const status = String(message).toLowerCase().includes("forbidden") ? 403 : 500;
    return NextResponse.json(new ApiResponse(status, message, "", false), { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = getUserFromRequest(req);
    assertTechnicalAdmin(admin.role);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json(new ApiResponse(400, "id required", "", false), { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json(new ApiResponse(200, "User deleted", { id }, true), { status: 200 });
  } catch (error: any) {
    const message = error?.message || "Failed to delete user";
    const status = String(message).toLowerCase().includes("forbidden") ? 403 : 500;
    return NextResponse.json(new ApiResponse(status, message, "", false), { status });
  }
}
