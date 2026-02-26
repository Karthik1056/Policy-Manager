"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { ArrowLeft, Save, History, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from "lucide-react";
import TabList from "@/components/policy-builder/TabList";
import SubTabSection from "@/components/policy-builder/SubTabSection";
import AIGeneratePolicy from "@/components/policy-builder/AIGeneratePolicy";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { unwrapApiData } from "@/lib/unwrapApiData";
import type { Tab } from "@/types";
import toast from "react-hot-toast";

export default function PolicyBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const isChecker = user?.role === "CHECKER";
  
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showPolicyUpdate, setShowPolicyUpdate] = useState(false);
  const [isPolicyInfoOpen, setIsPolicyInfoOpen] = useState(false);
  const [policy, setPolicy] = useState<any>(null);
  const [versionChangeEnabled, setVersionChangeEnabled] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [versionChangeNote, setVersionChangeNote] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isPublished = policy?.status === "PUBLISHED";
  const canEdit = !isPublished;
  const [formData, setFormData] = useState({
    name: "",
    product: "",
    status: "DRAFT",
    version: "",
    description: "",
  });

  useEffect(() => {
    if (params && params.id) {
      fetch(`/api/policy/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          const policyData = data.data;
          setPolicy(policyData);
          setFormData({
            name: policyData.name || "",
            product: policyData.product || "",
            status: policyData.status || "DRAFT",
            version: policyData.version || "",
            description: policyData.description || "",
          });
        });
    }
  }, [params]);

  const { data: tabs = [] } = useQuery({
    queryKey: ["tabs", params?.id],
    queryFn: async () => {
      const { data } = await api.get(`/tab?policyId=${params?.id}`);
      const tabsData = unwrapApiData<Tab[]>(data);
      if (tabsData.length > 0 && !activeTabId) {
        setActiveTabId(tabsData[0].id);
      }
      return tabsData;
    },
    enabled: !!params?.id,
  });

  const handleVersionToggle = async () => {
    if (!versionChangeEnabled) {
      if (!versionChangeNote.trim()) {
        toast.error("Please add a note describing the version change");
        return;
      }
      setShowConfirmModal(true);
    } else {
      setVersionChangeEnabled(false);
      setNewVersion("");
      setVersionChangeNote("");
    }
  };

  const confirmVersionChange = async () => {
    try {
      await api.post("/policy/version", {
        policyId: policy.id,
        versionNumber: policy.version,
        changeNote: versionChangeNote,
      });
      toast.success("Current version saved as snapshot");
      setVersionChangeEnabled(true);
      setShowConfirmModal(false);
    } catch {
      toast.error("Failed to save version snapshot");
    }
  };

  const handleAIGenerated = async (structure: any) => {
    const loadingToast = toast.loading("Creating policy structure...");
    try {
      for (const tab of structure.tabs) {
        const tabRes = await api.post("/tab/createTab", {
          name: tab.name,
          documentNotes: tab.documentNotes,
          policyEngineId: params?.id,
          orderIndex: structure.tabs.indexOf(tab)
        });
        const tabData = unwrapApiData(tabRes.data);
        
        for (const subTab of tab.subTabs) {
          const subTabRes = await api.post("/subtab/create", {
            name: subTab.name,
            documentNotes: subTab.documentNotes,
            tabId: tabData.id,
            orderIndex: tab.subTabs.indexOf(subTab)
          });
          const subTabData = unwrapApiData(subTabRes.data);
          
          for (const field of subTab.fields) {
            await api.post("/field/create", {
              ...field,
              subTabId: subTabData.id,
              orderIndex: subTab.fields.indexOf(field)
            });
          }
        }
      }
      toast.success("Policy structure created!", { id: loadingToast });
      window.location.reload();
    } catch (error) {
      toast.error("Failed to create structure", { id: loadingToast });
    }
  };

  const handleSavePolicy = async () => {
    const loadingToast = toast.loading("Updating policy...");
    try {
      const updateData = versionChangeEnabled && newVersion 
        ? { ...formData, version: newVersion }
        : formData;
      await api.patch(`/policy/${params?.id}`, updateData);
      toast.success("Policy updated!", { id: loadingToast });
      setVersionChangeEnabled(false);
      setNewVersion("");
      window.location.reload();
    } catch {
      toast.error("Failed to update policy", { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="flex gap-3">
            {isChecker && (
              <button
                onClick={() => setShowPolicyUpdate(!showPolicyUpdate)}
                className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
              >
                <History size={16} />
                {showPolicyUpdate ? "Hide" : "Show"} Updates
              </button>
            )}
            <button onClick={handleSavePolicy} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700" disabled={!canEdit}>
              <Save size={16} />
              Save Policy
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {!isPublished && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={handleVersionToggle}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                disabled={!versionChangeEnabled && !versionChangeNote.trim()}
              >
                {versionChangeEnabled ? (
                  <ToggleRight size={32} className="text-blue-600" />
                ) : (
                  <ToggleLeft size={32} className="text-gray-400" />
                )}
                <span className="text-sm font-medium text-blue-900">Change Version</span>
              </button>
              {versionChangeEnabled && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-700">New Version:</span>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="e.g., 1.1"
                    className="px-3 py-2 border rounded text-sm text-gray-900 w-32"
                  />
                </div>
              )}
              <span className="text-xs text-blue-700 ml-auto">Current: v{policy?.version}</span>
            </div>
            {!versionChangeEnabled && (
              <div className="mb-2">
                <label className="block text-sm font-medium text-blue-900 mb-1">Version Change Note (Required)</label>
                <textarea
                  value={versionChangeNote}
                  onChange={(e) => setVersionChangeNote(e.target.value)}
                  placeholder="Describe what changes you're making in this version..."
                  className="w-full px-3 py-2 border rounded text-sm text-gray-900"
                  rows={2}
                />
              </div>
            )}
            {versionChangeEnabled && (
              <div className="space-y-2">
                <p className="text-xs text-blue-700">✓ Previous version snapshot saved. Enter new version number and save your changes.</p>
                <div className="bg-white p-2 rounded border">
                  <p className="text-xs font-medium text-gray-700">Change Note:</p>
                  <p className="text-xs text-gray-600">{versionChangeNote}</p>
                </div>
              </div>
            )}
          </div>
        )}
        {showPolicyUpdate && isChecker && policy && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-purple-900">Policy Update History</h2>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">Version {policy.version}</p>
                  <p className="text-sm text-gray-600">Updated: {new Date(policy.updatedAt).toLocaleString()}</p>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                  {policy.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {isPublished && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-800 text-sm font-medium">This policy is published and cannot be edited.</p>
          </div>
        )}

        <div className="bg-white rounded-xl border shadow-sm">
          <div 
            className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => setIsPolicyInfoOpen(!isPolicyInfoOpen)}
          >
            <h2 className="text-xl font-bold text-gray-900">Policy Information</h2>
            {isPolicyInfoOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          {isPolicyInfoOpen && (
            <div className="px-6 pb-6 border-t">
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Policy Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Product</label>
                  <input
                    type="text"
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Version</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                    disabled={!canEdit}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Policy Rules</h2>
            {canEdit && tabs.length === 0 && (
              <AIGeneratePolicy onGenerated={handleAIGenerated} />
            )}
          </div>
          {canEdit ? (
            <>
              <TabList
                tabs={tabs}
                activeId={activeTabId}
                onSelect={setActiveTabId}
                policyId={params?.id as string}
              />
              <div className="mt-6">
                {activeTabId && <SubTabSection tabId={activeTabId} />}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>This policy is published and cannot be edited.</p>
            </div>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowConfirmModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Version Change</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will save the current version (v{policy?.version}) as a snapshot. You can then make changes and save with a new version number.
            </p>
            <div className="bg-blue-50 p-3 rounded mb-4">
              <p className="text-xs font-medium text-gray-700 mb-1">Change Note:</p>
              <p className="text-sm text-gray-900">{versionChangeNote}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmVersionChange}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
