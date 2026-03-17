"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setPolicyJson } from "@/store/slices/policySlice";
import { ArrowLeft, Save, History, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, FileText, X, AlignLeft, Table2 } from "lucide-react";
import TabList from "@/components/policy-builder/TabList";
import SubTabSection from "@/components/policy-builder/SubTabSection";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { unwrapApiData } from "@/lib/unwrapApiData";
import type { Tab } from "@/types";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FloatingChatBot from "@/components/policy-builder/FloatingChatBot";
import PolicyDraft from "@/components/policy-builder/PolicyDraft";
import AnalysisButton from "@/components/policy-builder/AnalysisButton";

export default function PolicyBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const policyJson = useSelector((state: RootState) => state.policy.policyJson);
  const isChecker = user?.role === "CHECKER";
  
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showPolicyUpdate, setShowPolicyUpdate] = useState(false);
  const [isPolicyInfoOpen, setIsPolicyInfoOpen] = useState(false);
  const [isDraftPanelOpen, setIsDraftPanelOpen] = useState(false);
  const [draftViewMode, setDraftViewMode] = useState<"document" | "table">("document");
  const [policy, setPolicy] = useState<any>(null);
  const [checkers, setCheckers] = useState<any[]>([]);
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
    checkerId: "",
  });

  useEffect(() => {
    api.get("/users/get?role=CHECKER").then(({ data }) => {
      const list = data?.data;
      setCheckers(Array.isArray(list) ? list : []);
    }).catch(() => setCheckers([]));
  }, []);

  useEffect(() => {
    if (params && params.id) {
      api.get(`/policy/${params.id}`).then(({ data }) => {
        const policyData = data.data;
          setPolicy(policyData);
          setFormData({
            name: policyData.name || "",
            product: policyData.product || "",
            status: policyData.status || "DRAFT",
            version: policyData.version || "",
            description: policyData.description || "",
            checkerId: policyData.checkerId || "",
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
      
      // Update policy JSON in Redux
      if (policy && tabsData) {
        const updatedPolicyJson = {
          ...policy,
          tabs: tabsData
        };
        dispatch(setPolicyJson(updatedPolicyJson));
      }
      
      return tabsData;
    },
    enabled: !!params?.id,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 1500,
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
    <div className="relative min-h-screen overflow-hidden bg-gray-50">
      <div className="bg-white border-b px-8 py-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDraftPanelOpen((prev) => !prev)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 inline-flex items-center gap-2"
            >
              <FileText size={16} />
              {isDraftPanelOpen ? "Hide Document" : "View Document"}
            </button>
            {isChecker && (
              <Button variant="outline" onClick={() => setShowPolicyUpdate(!showPolicyUpdate)}>
                <History size={16} className="mr-2" />
                {showPolicyUpdate ? "Hide" : "Show"} Updates
              </Button>
            )}
            <Button onClick={handleSavePolicy} disabled={!canEdit}>
              <Save size={16} className="mr-2" />
              Save Policy
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {!isPublished && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-3">
                <Button
                  variant="ghost"
                  onClick={handleVersionToggle}
                  disabled={!versionChangeEnabled && !versionChangeNote.trim()}
                  className="p-0 h-auto hover:bg-transparent"
                >
                  {versionChangeEnabled ? (
                    <ToggleRight size={32} className="text-blue-600" />
                  ) : (
                    <ToggleLeft size={32} className="text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-blue-900 ml-2">Change Version</span>
                </Button>
                {versionChangeEnabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-700">New Version:</span>
                    <Input
                      type="text"
                      value={newVersion}
                      onChange={(e) => setNewVersion(e.target.value)}
                      placeholder="e.g., 1.1"
                      className="w-32"
                    />
                  </div>
                )}
                <Badge variant="secondary" className="ml-auto">Current: v{policy?.version}</Badge>
              </div>
              {!versionChangeEnabled && (
                <div className="mb-2">
                  <Label htmlFor="versionNote" className="text-blue-900">Version Change Note (Required)</Label>
                  <Textarea
                    id="versionNote"
                    value={versionChangeNote}
                    onChange={(e) => setVersionChangeNote(e.target.value)}
                    placeholder="Describe what changes you're making in this version..."
                    rows={2}
                  />
                </div>
              )}
              {versionChangeEnabled && (
                <div className="space-y-2">
                  <p className="text-xs text-blue-700">✓ Previous version snapshot saved. Enter new version number and save your changes.</p>
                  <Card>
                    <CardContent className="p-2">
                      <p className="text-xs font-medium text-gray-700">Change Note:</p>
                      <p className="text-xs text-gray-600">{versionChangeNote}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {showPolicyUpdate && isChecker && policy && (
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg text-purple-900">Policy Update History</CardTitle>
            </CardHeader>
            <CardContent>
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">Version {policy.version}</p>
                      <p className="text-sm text-gray-600">Updated: {new Date(policy.updatedAt).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="bg-purple-100 text-purple-700">
                      {policy.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {isPublished && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <p className="text-yellow-800 text-sm font-medium">This policy is published and cannot be edited.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => setIsPolicyInfoOpen(!isPolicyInfoOpen)}
          >
            <div className="flex items-center justify-between">
              <CardTitle>Policy Information</CardTitle>
              {isPolicyInfoOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </CardHeader>
          {isPolicyInfoOpen && (
            <CardContent className="border-t">
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="policyName">Policy Name</Label>
                  <Input
                    id="policyName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Input
                    id="product"
                    type="text"
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })} disabled={!canEdit}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">DRAFT</SelectItem>
                      <SelectItem value="IN_REVIEW">IN_REVIEW</SelectItem>
                      <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="checker">Assign Checker</Label>
                  <Select value={formData.checkerId} onValueChange={(value) => setFormData({ ...formData, checkerId: value })} disabled={!canEdit}>
                    <SelectTrigger id="checker">
                      <SelectValue placeholder="Select checker" />
                    </SelectTrigger>
                    <SelectContent>
                      {checkers.map((checker) => (
                        <SelectItem key={checker.id} value={checker.id}>
                          {checker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="w-full">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Policy Rules</CardTitle>
                  <AnalysisButton 
                    policyData={policyJson || policy}
                    policyId={params?.id as string}
                  />
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
        </div>

        {/* Sliding Draft Panel */}
        <aside
          className={`fixed inset-y-0 right-0 z-40 w-full max-w-2xl border-l bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            isDraftPanelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b bg-white px-5 py-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Policy Document Draft</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-md border border-slate-300 bg-white p-0.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setDraftViewMode("document")}
                    className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-semibold transition-colors ${
                      draftViewMode === "document"
                        ? "bg-slate-100 text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <AlignLeft size={14} />
                    Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftViewMode("table")}
                    className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-semibold transition-colors ${
                      draftViewMode === "table"
                        ? "bg-slate-100 text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Table2 size={14} />
                    Table
                  </button>
                </div>
                <button
                  onClick={() => setIsDraftPanelOpen(false)}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PolicyDraft
                data={{
                  name: policy?.name || formData.name,
                  description: policy?.description || formData.description,
                  product: policy?.product || formData.product,
                  version: policy?.version || formData.version,
                  status: policy?.status || formData.status,
                  startDate: policy?.startDate || policy?.effectiveDate || policy?.createdAt,
                  tabs: tabs as Tab[],
                }}
                viewMode={draftViewMode}
              />
            </div>
          </div>
        </aside>

        {/* Backdrop */}
        {isDraftPanelOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsDraftPanelOpen(false)}
          />
        )}

        {canEdit && (
          <FloatingChatBot 
            currentPolicy={policyJson || policy}
            policyId={params?.id as string}
            onPolicyUpdate={(action) => {
              window.location.reload();
            }}
          />
        )}
      </div>

      {showConfirmModal && (
        <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Version Change</AlertDialogTitle>
              <AlertDialogDescription>
                This will save the current version (v{policy?.version}) as a snapshot. You can then make changes and save with a new version number.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Card className="bg-blue-50">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Change Note:</p>
                <p className="text-sm text-gray-900">{versionChangeNote}</p>
              </CardContent>
            </Card>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmVersionChange}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
