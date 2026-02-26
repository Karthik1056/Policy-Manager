import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Policy } from "@/types";
import { unwrapApiData } from "@/lib/unwrapApiData";

// Fetch all policies for the list view
export const useAllPolicies = () => {
  return useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const { data } = await api.get("/policy");
      return unwrapApiData<Policy[]>(data);
    },
  });
};

// Fetch a single policy by ID
export const usePolicyDetails = (id: string) => {
  return useQuery({
    queryKey: ["policy", id],
    queryFn: async () => {
      const { data } = await api.get(`/policy/${id}`);
      return unwrapApiData<Policy>(data);
    },
    enabled: !!id,
  });
};

// Create a new policy (Step 1)
export const useCreatePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (policyData: Partial<Policy> & Record<string, unknown>) => api.post("/policy", policyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
  });
};
