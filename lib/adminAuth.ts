import { NextRequest } from "next/server";

export function getUserFromRequest(req: NextRequest): { id: string; role: string; name?: string; email?: string } {
  const header = req.headers.get("x-user-data");
  if (!header) throw new Error("Unauthorized");
  const parsed = JSON.parse(header);
  return {
    id: parsed.id,
    role: String(parsed.role || ""),
    name: parsed.name,
    email: parsed.email,
  };
}

export function normalizeRole(role: string) {
  return String(role || "").trim().toUpperCase();
}

export function assertAnyAdmin(role: string) {
  const r = normalizeRole(role);
  if (!["ADMIN", "IT_ADMIN", "ITADMIN"].includes(r)) {
    throw new Error("Forbidden: admin access required");
  }
}

export function assertTechnicalAdmin(role: string) {
  const r = normalizeRole(role);
  if (r !== "IT_ADMIN" && r !== "ITADMIN") {
    throw new Error("Forbidden: IT admin access required");
  }
}

export function assertPolicyAdmin(role: string) {
  const r = normalizeRole(role);
  if (r !== "ADMIN") {
    throw new Error("Forbidden: policy admin access required");
  }
}

export function assertMakerForPolicyEdit(role: string) {
  const r = normalizeRole(role);
  if (r !== "MAKER") {
    throw new Error("Forbidden: only MAKER can edit policy structure");
  }
}

export function assertAdmin(role: string) {
  const r = role.toUpperCase();
  if (!["ADMIN", "IT_ADMIN"].includes(r)) {
    throw new Error("Forbidden: admin access required");
  }
}
