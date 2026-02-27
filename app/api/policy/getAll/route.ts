import { getAllPolicies } from "@/controller/policy.controller";
import { ApiResponse } from "@/utils/ApiResponce";
import { NextRequest, NextResponse } from "next/server";
import { getAccessiblePolicyIds } from "@/lib/adminWorkflowStore";

export async function GET(req: NextRequest) {
  try {
    const policies = await getAllPolicies();

    const userDataRaw = req.headers.get("x-user-data");
    if (!userDataRaw) {
      return NextResponse.json(new ApiResponse(200, "All policies fetch successfully", policies, true), { status: 200 });
    }

    const userData = JSON.parse(userDataRaw);
    const role = String(userData.role || "").toUpperCase();
    if (["ADMIN"].includes(role)) {
      return NextResponse.json(new ApiResponse(200, "All policies fetch successfully", policies, true), { status: 200 });
    }

    const accessiblePolicyIds = await getAccessiblePolicyIds(userData.id);

    const filtered = (policies || []).filter((p: any) =>
      p?.makerId === userData.id ||
      p?.checkerId === userData.id ||
      accessiblePolicyIds.includes(p.id)
    );

    return NextResponse.json(new ApiResponse(200, "All policies fetch successfully", filtered, true), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(new ApiResponse(500, error?.message || "Internal server error", "", false), { status: 500 });
  }
}
