import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { unwrapApiData } from "@/lib/unwrapApiData";
import type { Tab } from "@/types";

// Fetch all Tabs for a Policy
export const useTabs = (policyId: string) => {
  return useQuery({
    queryKey: ["tabs", policyId],
    queryFn: async () => {
      const { data } = await api.get(`/tab?policyId=${policyId}`);
      return unwrapApiData<Tab[]>(data);
    },
    enabled: !!policyId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 1500,
  });
};

// Create a New Tab
export const useCreateTab = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTab: { name: string; orderIndex: number; policyEngineId: string }) =>
      api.post("/tab/createTab", newTab),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tabs", variables.policyEngineId] });
      toast.success("Tab created!");
    },
  });
};

// Auto-Save Field Mutation (Phase 3 "Killer Feature")
export const useUpdateField = () => {
  return useMutation({
    mutationFn: (field: { id: string; thresholdValue?: string; operator?: string }) =>
      api.patch(`/field/${field.id}`, field),
    onSuccess: () => {
      toast.success("Rule auto-saved", { duration: 1000 });
    },
  });
};
