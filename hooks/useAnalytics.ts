import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { unwrapApiData } from "@/lib/unwrapApiData";

type PolicyStats = {
  total: number;
  draft: number;
  inReview: number;
  published: number;
};

export const usePolicyStats = () => {
  return useQuery({
    queryKey: ["policy-stats"],
    queryFn: async () => {
      const { data } = await api.get("/policy/stats");
      // Expecting: { total: 10, draft: 5, inReview: 2, published: 3 }
      return unwrapApiData<PolicyStats>(data);
    },
  });
};
