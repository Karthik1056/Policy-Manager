import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { unwrapApiData } from "@/lib/unwrapApiData";

type SimulateArgs = { policyId: string; testData: Record<string, string> };

export const useSimulatePolicy = () => {
  return useMutation({
    mutationFn: async ({ policyId, testData }: SimulateArgs) => {
      const { data } = await api.post("/approval", {
        action: "SIMULATE",
        policyId,
        testData,
      });
      return unwrapApiData<unknown[]>(data); 
    },
  });
};
