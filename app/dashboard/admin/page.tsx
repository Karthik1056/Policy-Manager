"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";

type AdminUser = { id: string; name: string; email: string; role: string; createdAt?: string };
type Policy = { id: string; name: string; status: string };
type RoleDef = { id: string; name: string; description?: string | null };
type OrgUnit = { id: string; name: string; level: number; parent_id?: string | null };
type PolicyAccess = { id: string; policy_id: string; user_id: string; access_type: string; created_at?: string };
type WorkflowStep = {
  id?: string;
  step_order: number;
  step_name: string;
  approval_mode: string;
  required_approvals: number;
  role_name?: string | null;
  user_ids?: string | null;
  condition_json?: string | null;
  sla_hours?: number;
};
type Workflow = {
  id: string;
  name: string;
  flow_type: string;
  sla_hours: number;
  is_active?: boolean;
  steps?: WorkflowStep[];
};
type ApprovalInstance = {
  id: string;
  policy_id: string;
  workflow_id: string;
  step_id: string;
  assigned_user_id?: string | null;
  committee_group?: string | null;
  status: string;
  due_at?: string | null;
  is_overdue: boolean;
};

type StepDraft = {
  stepOrder: number;
  stepName: string;
  approvalMode: string;
  requiredApprovals: number;
  roleName: string;
  userIds: string;
  conditionJson: string;
  slaHours: number;
};

const emptyStep = (order: number): StepDraft => ({
  stepOrder: order,
  stepName: `Step ${order}`,
  approvalMode: "SEQUENTIAL",
  requiredApprovals: 1,
  roleName: "",
  userIds: "",
  conditionJson: "",
  slaHours: 24,
});

export default function AdminPage() {
  const user = useAppSelector((state) => state.auth.user);
  const role = String(user?.role || "").toUpperCase();
  const isTechnicalAdmin = role === "IT_ADMIN";
  const isPolicyAdmin = role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [accessRows, setAccessRows] = useState<PolicyAccess[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [instances, setInstances] = useState<ApprovalInstance[]>([]);

  const [newUser, setNewUser] = useState({ name: "", email: "", role: "MAKER", password: "" });
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [newOrgUnit, setNewOrgUnit] = useState({ name: "", level: 1, parentId: "" });
  const [access, setAccess] = useState({ policyId: "", userId: "", accessType: "VIEW" });
  const [workflow, setWorkflow] = useState({ name: "", flowType: "SEQUENTIAL", slaHours: 24, orgUnitId: "" });
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep(1)]);
  const [assignMap, setAssignMap] = useState<Record<string, string>>({});

  const isOverdueCount = useMemo(() => instances.filter((i) => i.is_overdue && i.status === "PENDING").length, [instances]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const fetchJson = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) return { data: [] };
        return res.json();
      };

      const [u, p, r, o, a, w, i] = await Promise.all([
        fetchJson("/api/admin/users"),
        fetchJson("/api/policy/getAll"),
        fetchJson("/api/admin/roles"),
        fetchJson("/api/admin/org"),
        isPolicyAdmin ? fetchJson("/api/admin/policy-access") : Promise.resolve({ data: [] }),
        isPolicyAdmin ? fetchJson("/api/admin/workflows") : Promise.resolve({ data: [] }),
        isPolicyAdmin ? fetchJson("/api/admin/workflows/instances") : Promise.resolve({ data: [] }),
      ]);

      setUsers(u?.data || []);
      setPolicies(p?.data || []);
      setRoles(r?.data || []);
      setOrgUnits(o?.data || []);
      setAccessRows(a?.data || []);
      setWorkflows(w?.data || []);
      setInstances(i?.data || []);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createUser = async () => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.message || "Failed to create user");
    toast.success("User created");
    setNewUser({ name: "", email: "", role: "MAKER", password: "" });
    loadAll();
  };

  const updateUserRole = async (id: string, role: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.message || "Failed to update user");
    toast.success("User role updated");
    loadAll();
  };

  const deleteUser = async (id: string) => {
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.message || "Failed to delete user");
    toast.success("User deleted");
    loadAll();
  };

  const createRole = async () => {
    const res = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRole),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.message || "Failed to create role");
    toast.success("Role created");
    setNewRole({ name: "", description: "" });
    loadAll();
  };

  const createOrgUnit = async () => {
    const res = await fetch("/api/admin/org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOrgUnit),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.message || "Failed to create org unit");
    toast.success("Org unit created");
    setNewOrgUnit({ name: "", level: 1, parentId: "" });
    loadAll();
  };

  const assignAccess = async () => {
    const res = await fetch("/api/admin/policy-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(access),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.message || "Failed to assign access");
    toast.success("Policy access assigned");
    loadAll();
  };

  const removeAccess = async (policyId: string, userId: string) => {
    const res = await fetch(`/api/admin/policy-access?policyId=${policyId}&userId=${userId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.message || "Failed to remove access");
    toast.success("Access removed");
    loadAll();
  };

  const addStep = () => setSteps((prev) => [...prev, emptyStep(prev.length + 1)]);
  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index).map((step, i) => ({ ...step, stepOrder: i + 1 })));
  };

  const createWorkflow = async () => {
    const parsedSteps = [] as Array<Record<string, unknown>>;

    for (const s of steps) {
      let conditionJson: unknown = null;
      if (s.conditionJson.trim()) {
        try {
          conditionJson = JSON.parse(s.conditionJson);
        } catch {
          toast.error(`Invalid JSON in ${s.stepName}`);
          return;
        }
      }

      parsedSteps.push({
        stepOrder: s.stepOrder,
        stepName: s.stepName,
        approvalMode: s.approvalMode,
        requiredApprovals: Number(s.requiredApprovals || 1),
        roleName: s.roleName || null,
        userIds: s.userIds
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        conditionJson,
        slaHours: Number(s.slaHours || workflow.slaHours || 24),
      });
    }

    const payload = {
      ...workflow,
      steps: parsedSteps,
    };

    const res = await fetch("/api/admin/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.message || "Failed to create workflow");

    toast.success("Workflow created");
    setWorkflow({ name: "", flowType: "SEQUENTIAL", slaHours: 24, orgUnitId: "" });
    setSteps([emptyStep(1)]);
    loadAll();
  };

  const assignWorkflow = async (policyId: string) => {
    const workflowId = assignMap[policyId];
    if (!workflowId) return toast.error("Select a workflow first");

    const res = await fetch("/api/admin/workflows/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyId, workflowId }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.message || "Failed to assign workflow");
    toast.success("Workflow assigned to policy");
  };

  const userById = useMemo(() => {
    const dict: Record<string, AdminUser> = {};
    for (const u of users) dict[u.id] = u;
    return dict;
  }, [users]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin + Workflow Engine</h1>
        <p className="text-sm text-gray-500">
          {isTechnicalAdmin
            ? "IT_ADMIN: manage technical setup (users, roles, org hierarchy)."
            : "ADMIN: policy oversight (workflow, policy access, SLA) with read-only policy content + comments."}
        </p>
      </div>

      {isPolicyAdmin && (
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs uppercase text-gray-500">Pending Approvals</div>
          <div className="text-2xl font-semibold">{instances.filter((i) => i.status === "PENDING").length}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs uppercase text-gray-500">SLA Breached</div>
          <div className="text-2xl font-semibold text-red-600">{isOverdueCount}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs uppercase text-gray-500">Configured Workflows</div>
          <div className="text-2xl font-semibold">{workflows.length}</div>
        </div>
      </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {isTechnicalAdmin && (
        <section className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold">Create User</h2>
          <input className="w-full border rounded px-3 py-2" placeholder="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
          <input className="w-full border rounded px-3 py-2" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <select className="w-full border rounded px-3 py-2" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
            <option value="MAKER">MAKER</option>
            <option value="CHECKER">CHECKER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="IT_ADMIN">IT_ADMIN</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
          <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={createUser}>Create User</button>
        </section>
        )}

        {isTechnicalAdmin && (
        <section className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold">Dynamic Role + Org Structure</h2>
          <input className="w-full border rounded px-3 py-2" placeholder="Role Name" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} />
          <input className="w-full border rounded px-3 py-2" placeholder="Role Description" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} />
          <button className="px-4 py-2 bg-gray-900 text-white rounded" onClick={createRole}>Create Role</button>

          <div className="border-t pt-3 space-y-2">
            <input className="w-full border rounded px-3 py-2" placeholder="Org Unit Name" value={newOrgUnit.name} onChange={(e) => setNewOrgUnit({ ...newOrgUnit, name: e.target.value })} />
            <input className="w-full border rounded px-3 py-2" type="number" min={1} placeholder="Level" value={newOrgUnit.level} onChange={(e) => setNewOrgUnit({ ...newOrgUnit, level: Number(e.target.value) })} />
            <select className="w-full border rounded px-3 py-2" value={newOrgUnit.parentId} onChange={(e) => setNewOrgUnit({ ...newOrgUnit, parentId: e.target.value })}>
              <option value="">No Parent</option>
              {orgUnits.map((o) => (
                <option key={o.id} value={o.id}>L{o.level} - {o.name}</option>
              ))}
            </select>
            <button className="px-4 py-2 bg-slate-700 text-white rounded" onClick={createOrgUnit}>Create Org Unit</button>
          </div>
        </section>
        )}
      </div>

      {isPolicyAdmin && (
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold">Policy Access Management</h2>
          <select className="w-full border rounded px-3 py-2" value={access.policyId} onChange={(e) => setAccess({ ...access, policyId: e.target.value })}>
            <option value="">Select Policy</option>
            {policies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="w-full border rounded px-3 py-2" value={access.userId} onChange={(e) => setAccess({ ...access, userId: e.target.value })}>
            <option value="">Select User</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
          <select className="w-full border rounded px-3 py-2" value={access.accessType} onChange={(e) => setAccess({ ...access, accessType: e.target.value })}>
            <option value="VIEW">VIEW</option>
            <option value="EDIT">EDIT</option>
            <option value="APPROVE">APPROVE</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={assignAccess}>Assign Access</button>

          <div className="pt-2 space-y-2 max-h-48 overflow-auto">
            {accessRows.map((row) => (
              <div key={row.id} className="text-sm border rounded px-3 py-2 flex items-center justify-between gap-2">
                <span>
                  {policies.find((p) => p.id === row.policy_id)?.name || row.policy_id.slice(0, 8)} {" -> "} {userById[row.user_id]?.name || row.user_id.slice(0, 8)} ({row.access_type})
                </span>
                <button className="text-red-600" onClick={() => removeAccess(row.policy_id, row.user_id)}>Remove</button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold">Workflow Engine</h2>
          <input className="w-full border rounded px-3 py-2" placeholder="Workflow Name" value={workflow.name} onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })} />
          <select className="w-full border rounded px-3 py-2" value={workflow.flowType} onChange={(e) => setWorkflow({ ...workflow, flowType: e.target.value })}>
            <option value="SEQUENTIAL">SEQUENTIAL</option>
            <option value="PARALLEL">PARALLEL</option>
            <option value="COMMITTEE">COMMITTEE</option>
            <option value="CONDITIONAL">CONDITIONAL</option>
          </select>
          <select className="w-full border rounded px-3 py-2" value={workflow.orgUnitId} onChange={(e) => setWorkflow({ ...workflow, orgUnitId: e.target.value })}>
            <option value="">Org Unit (Optional)</option>
            {orgUnits.map((o) => <option key={o.id} value={o.id}>L{o.level} - {o.name}</option>)}
          </select>
          <input className="w-full border rounded px-3 py-2" type="number" min={1} placeholder="Default SLA Hours" value={workflow.slaHours} onChange={(e) => setWorkflow({ ...workflow, slaHours: Number(e.target.value) })} />

          <div className="border rounded p-3 space-y-3">
            <div className="font-medium text-sm">Steps (IF-THEN, sequential/parallel/committee/custom)</div>
            {steps.map((s, idx) => (
              <div key={`${s.stepOrder}-${idx}`} className="border rounded p-3 space-y-2">
                <div className="grid md:grid-cols-2 gap-2">
                  <input className="border rounded px-2 py-1" value={s.stepName} onChange={(e) => setSteps((prev) => prev.map((item, i) => i === idx ? { ...item, stepName: e.target.value } : item))} placeholder="Step Name" />
                  <select className="border rounded px-2 py-1" value={s.approvalMode} onChange={(e) => setSteps((prev) => prev.map((item, i) => i === idx ? { ...item, approvalMode: e.target.value } : item))}>
                    <option value="SEQUENTIAL">SEQUENTIAL</option>
                    <option value="PARALLEL">PARALLEL</option>
                    <option value="COMMITTEE">COMMITTEE</option>
                    <option value="CONDITIONAL">CONDITIONAL</option>
                  </select>
                </div>
                <div className="grid md:grid-cols-3 gap-2">
                  <input className="border rounded px-2 py-1" type="number" min={1} value={s.requiredApprovals} onChange={(e) => setSteps((prev) => prev.map((item, i) => i === idx ? { ...item, requiredApprovals: Number(e.target.value) } : item))} placeholder="Required Approvals" />
                  <input className="border rounded px-2 py-1" value={s.roleName} onChange={(e) => setSteps((prev) => prev.map((item, i) => i === idx ? { ...item, roleName: e.target.value } : item))} placeholder="Role Name (Director/CEO)" />
                  <input className="border rounded px-2 py-1" type="number" min={1} value={s.slaHours} onChange={(e) => setSteps((prev) => prev.map((item, i) => i === idx ? { ...item, slaHours: Number(e.target.value) } : item))} placeholder="SLA Hours" />
                </div>
                <input className="w-full border rounded px-2 py-1" value={s.userIds} onChange={(e) => setSteps((prev) => prev.map((item, i) => i === idx ? { ...item, userIds: e.target.value } : item))} placeholder="Assigned User IDs (comma separated)" />
                <textarea className="w-full border rounded px-2 py-1 min-h-[72px]" value={s.conditionJson} onChange={(e) => setSteps((prev) => prev.map((item, i) => i === idx ? { ...item, conditionJson: e.target.value } : item))} placeholder='Condition JSON (optional): {"productEquals":"Home Loan"}' />
                {steps.length > 1 && (
                  <button className="text-xs text-red-600" onClick={() => removeStep(idx)}>Remove Step</button>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-gray-100 rounded border" onClick={addStep}>Add Step</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={createWorkflow}>Create Workflow</button>
            </div>
          </div>
        </section>
      </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {isTechnicalAdmin && (
        <section className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-3">Users</h2>
          <div className="space-y-2 max-h-72 overflow-auto">
            {users.map((u) => (
              <div key={u.id} className="text-sm border rounded px-3 py-2 flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-gray-500">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <select className="border rounded px-2 py-1" value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value)}>
                    <option value="MAKER">MAKER</option>
                    <option value="CHECKER">CHECKER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="IT_ADMIN">IT_ADMIN</option>
                    {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                  <button className="text-red-600" onClick={() => deleteUser(u.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {isPolicyAdmin && (
        <section className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-3">Configured Workflows + Policy Assignment</h2>
          <div className="space-y-2 max-h-72 overflow-auto">
            {workflows.map((w) => (
              <div key={w.id} className="text-sm border rounded px-3 py-3 space-y-2">
                <div className="font-medium">{w.name}</div>
                <div className="text-gray-500">Type: {w.flow_type} | SLA: {w.sla_hours}h | Steps: {w.steps?.length || 0}</div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-blue-600">View Steps</summary>
                  <div className="mt-2 space-y-1">
                    {(w.steps || []).map((step) => (
                      <div key={step.id} className="border rounded px-2 py-1">
                        #{step.step_order} {step.step_name} [{step.approval_mode}] req={step.required_approvals}, role={step.role_name || "-"}, sla={step.sla_hours || w.sla_hours}h
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t pt-3 space-y-2">
            <h3 className="font-medium">Assign Workflow to Policy</h3>
            {policies.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="flex-1 text-sm">{p.name}</div>
                <select className="border rounded px-2 py-1" value={assignMap[p.id] || ""} onChange={(e) => setAssignMap((prev) => ({ ...prev, [p.id]: e.target.value }))}>
                  <option value="">Select workflow</option>
                  {workflows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <button className="px-3 py-1 bg-slate-800 text-white rounded" onClick={() => assignWorkflow(p.id)}>Assign</button>
              </div>
            ))}
          </div>
        </section>
        )}
      </div>

      {isPolicyAdmin && (
      <section className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-3">SLA Tracking (Approval Instances)</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-auto">
            {instances.map((inst) => (
              <div key={inst.id} className="text-sm border rounded px-3 py-2 flex items-center justify-between">
                <span>Policy {inst.policy_id.slice(0, 8)} | Workflow {inst.workflow_id.slice(0, 8)} | Status {inst.status}</span>
                <span className={inst.is_overdue ? "text-red-600" : "text-gray-600"}>{inst.is_overdue ? "Overdue" : "On Time"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      )}
    </div>
  );
}
