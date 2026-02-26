import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { unwrapApiData } from "@/lib/unwrapApiData";
import type { Tab } from "@/types";

export const useTabs = (policyId: string) => {
  return useQuery({
    queryKey: ["tabs", policyId],
    queryFn: async () => {
      const { data } = await api.get(`/tab?policyId=${policyId}`);
      return unwrapApiData<Tab[]>(data);
    },
    enabled: !!policyId,
  });
};

export const useCreateTab = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTab: { name: string; orderIndex: number; policyEngineId: string }) =>
      api.post("/tab", newTab),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tabs", variables.policyEngineId] });
      toast.success(`Tab "${variables.name}" created!`);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message || "Failed to create tab"
          : "Failed to create tab";
      toast.error(message);
    }
  });
};
