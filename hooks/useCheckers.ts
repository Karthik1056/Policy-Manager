import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

type User = { id: string; name: string; email: string; role: string };

export const useCheckers = () => {
  return useQuery({
    queryKey: ["checkers"],
    queryFn: async () => {
      const { data } = await api.get("/admin/users");
      const allUsers = (data.data || []) as User[];
      return allUsers.filter((u) => u.role === "CHECKER");
    },
  });
};
