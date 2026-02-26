import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { unwrapApiData } from "@/lib/unwrapApiData";

type AuditLog = {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  createdAt: string | Date;
};

export const useAuditLogs = (policyId: string) => {
  return useQuery({
    queryKey: ["audit-logs", policyId],
    queryFn: async () => {
      const { data } = await api.get(`/policy/${policyId}/audit`);
      return unwrapApiData<AuditLog[]>(data); // Returns array of { action, details, performedBy, createdAt }
    },
    enabled: !!policyId,
  });
};
