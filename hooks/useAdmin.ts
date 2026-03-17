import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";

type AdminUser = { id: string; name: string; email: string; role: string; createdAt?: string };
type Policy = { id: string; name: string; status: string };
type RoleDef = { id: string; name: string; description?: string | null };
type OrgUnit = { id: string; name: string; level: number; parent_id?: string | null };
type PolicyAccess = { id: string; policy_id: string; user_id: string; access_type: string; created_at?: string };
type Workflow = { id: string; name: string; flow_type: string; sla_hours: number; is_active?: boolean; steps?: any[] };
type ApprovalInstance = { id: string; policy_id: string; workflow_id: string; step_id: string; assigned_user_id?: string | null; committee_group?: string | null; status: string; due_at?: string | null; is_overdue: boolean };

const fetchJson = async (url: string) => {
  try {
    const { data } = await api.get(url);
    return data;
  } catch {
    return { data: [] };
  }
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const result = await fetchJson("/admin/users");
      return (result?.data || []) as AdminUser[];
    },
  });
};

export const useAdminPolicies = () => {
  return useQuery({
    queryKey: ["admin", "policies"],
    queryFn: async () => {
      const result = await fetchJson("/api/policy/getAll");
      return (result?.data || []) as Policy[];
    },
  });
};

export const useAdminRoles = () => {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const result = await fetchJson("/api/admin/roles");
      return (result?.data || []) as RoleDef[];
    },
  });
};

export const useAdminOrgUnits = () => {
  return useQuery({
    queryKey: ["admin", "orgUnits"],
    queryFn: async () => {
      const result = await fetchJson("/api/admin/org");
      return (result?.data || []) as OrgUnit[];
    },
  });
};

export const useAdminPolicyAccess = (enabled: boolean) => {
  return useQuery({
    queryKey: ["admin", "policyAccess"],
    queryFn: async () => {
      const result = await fetchJson("/api/admin/policy-access");
      return (result?.data || []) as PolicyAccess[];
    },
    enabled,
  });
};

export const useAdminWorkflows = (enabled: boolean) => {
  return useQuery({
    queryKey: ["admin", "workflows"],
    queryFn: async () => {
      const result = await fetchJson("/api/admin/workflows");
      return (result?.data || []) as Workflow[];
    },
    enabled,
  });
};

export const useAdminInstances = (enabled: boolean) => {
  return useQuery({
    queryKey: ["admin", "instances"],
    queryFn: async () => {
      const result = await fetchJson("/api/admin/workflows/instances");
      return (result?.data || []) as ApprovalInstance[];
    },
    enabled,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newUser: { name: string; email: string; role: string; password: string }) => {
      const { data } = await api.post("/admin/users", newUser);
      return data;
    },
    onSuccess: () => {
      toast.success("User created");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message);
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { data } = await api.patch("/admin/users", { id, role });
      return data;
    },
    onSuccess: () => {
      toast.success("User role updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/users?id=${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message);
    },
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newRole: { name: string; description: string }) => {
      const { data } = await api.post("/admin/roles", newRole);
      return data;
    },
    onSuccess: () => {
      toast.success("Role created");
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message);
    },
  });
};

export const useCreateOrgUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newOrgUnit: { name: string; level: number; parentId: string }) => {
      const { data } = await api.post("/admin/org", newOrgUnit);
      return data;
    },
    onSuccess: () => {
      toast.success("Org unit created");
      queryClient.invalidateQueries({ queryKey: ["admin", "orgUnits"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message);
    },
  });
};

export const useAssignAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (access: { policyId: string; userId: string; accessType: string }) => {
      const { data } = await api.post("/admin/policy-access", access);
      return data;
    },
    onSuccess: () => {
      toast.success("Policy access assigned");
      queryClient.invalidateQueries({ queryKey: ["admin", "policyAccess"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message);
    },
  });
};

export const useRemoveAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ policyId, userId }: { policyId: string; userId: string }) => {
      const { data } = await api.delete(`/admin/policy-access?policyId=${policyId}&userId=${userId}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Access removed");
      queryClient.invalidateQueries({ queryKey: ["admin", "policyAccess"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message);
    },
  });
};

export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/admin/workflows", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Workflow created");
      queryClient.invalidateQueries({ queryKey: ["admin", "workflows"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message);
    },
  });
};

export const useAssignWorkflow = () => {
  return useMutation({
    mutationFn: async ({ policyId, workflowId }: { policyId: string; workflowId: string }) => {
      const { data } = await api.post("/admin/workflows/assign", { policyId, workflowId });
      return data;
    },
    onSuccess: () => {
      toast.success("Workflow assigned to policy");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message);
    },
  });
};
