import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { unwrapApiData } from "@/lib/unwrapApiData";

type ApprovalQueueItem = {
  id: string;
  name: string;
  version: string;
  updatedAt: string | Date;
};

export const useApprovalQueue = () => {
  return useQuery({
    queryKey: ["approval-queue"],
    queryFn: async () => {
      const { data } = await api.get("/approval/queue");
      return unwrapApiData<ApprovalQueueItem[]>(data); 
    },
  });
};

export const useProcessApproval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ policyId, action, notes }: { policyId: string, action: 'APPROVE' | 'REJECT', notes: string }) => {
      return api.post("/approval", { action, policyId, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-queue"] });
      toast.success("Decision recorded successfully");
    },
  });
};
