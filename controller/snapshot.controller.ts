import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";

type Actor = { name?: string };

export const createPolicySnapshot = async (
  policyId: string,
  reason: string,
  userData?: Actor,
  options?: { versionNumber?: string }
) => {
  const policy = await prisma.policyEngine.findUnique({
    where: { id: policyId },
    include: {
      tabs: {
        orderBy: { orderIndex: "asc" },
        include: {
          subTabs: {
            orderBy: { orderIndex: "asc" },
            include: {
              fields: { orderBy: { orderIndex: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!policy) {
    throw new ApiError(404, "Policy not found");
  }

  const snapshotVersion = options?.versionNumber || `${policy.version}-snapshot-${Date.now()}`;

  await prisma.policyVersion.create({
    data: {
      versionNumber: snapshotVersion,
      policyEngineId: policyId,
      snapshotData: policy as any,
    },
  });

  await prisma.auditLog.create({
    data: {
      policyEngineId: policyId,
      action: "UPDATED",
      details: `Snapshot saved before ${reason}`,
      performedBy: userData?.name || "SYSTEM",
    },
  });
};
