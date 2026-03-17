"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveTabId, setStep } from "@/store/slices/policySlice";
import { useTabs } from "@/hooks/useHierarchy";
import api from "@/lib/api";
import toast from "react-hot-toast";
import type { PolicyField, Tab } from "@/types";
import { ChevronDown, ChevronUp, PanelLeftClose, PanelLeftOpen, AlignLeft, Table2 } from "lucide-react";

import TabList from "@/components/policy-builder/TabList";
import SubTabSection from "@/components/policy-builder/SubTabSection";
import SimulationSheet from "@/components/simulation/SimulationSheet";
import PolicyChatPopup from "@/components/policy-builder/PolicyChatPopup";
import PolicyDraft from "@/components/policy-builder/PolicyDraft";

export default function BuildPolicyPage() {
  const params = useParams<{ id: string | string[] }>();
  const policyId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";

  const router = useRouter();
  const dispatch = useAppDispatch();

  const [isSimOpen, setIsSimOpen] = useState(false);
  const [showFieldRail, setShowFieldRail] = useState(true);
  const [showHeaderDetails, setShowHeaderDetails] = useState(true);
  const [isDraftPanelOpen, setIsDraftPanelOpen] = useState(false);
  const [draftViewMode, setDraftViewMode] = useState<"document" | "table">("document");
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<{ market?: any; structure?: any; consistency?: any } | null>(null);
  const [lastReviewedAt, setLastReviewedAt] = useState<string | null>(null);
  const [policyMeta, setPolicyMeta] = useState<{
    name?: string;
    description?: string;
    product?: string;
    version?: string | number;
    status?: string;
    startDate?: string;
  }>({});
  const activeTabId = useAppSelector((state) => state.policy.activeTabId);
  const role = String(useAppSelector((state) => state.auth.user?.role || "")).toUpperCase();

  const { data: tabsData, isLoading } = useTabs(policyId);
  const tabs = (tabsData ?? []) as Tab[];
  const validActiveTabId = tabs.some((tab) => tab.id === activeTabId) ? activeTabId : null;

  const allFields = useMemo<PolicyField[]>(
    () =>
      tabs
        .flatMap((tab) => tab.subTabs ?? [])
        .flatMap((subTab) => subTab.fields ?? [])
        .filter(Boolean)
        .map((field: any, index: number) => ({
          id: String(field?.id ?? `tmp-${index}`),
          fieldName: String(field?.fieldName ?? "Unnamed"),
          fieldType: String(field?.fieldType ?? "text"),
          operator: field?.operator ?? null,
          thresholdValue: field?.thresholdValue ?? null,
          rules: field?.rules ?? null,
          documentNotes: field?.documentNotes ?? null,
        })),
    [tabs]
  );

  const normalizeList = (items: any): string[] => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => String(item || "").trim()).filter(Boolean);
  };

  const runPrecautionaryReview = async (currentTabs: Tab[]) => {
    setReviewLoading(true);
    setReviewError(null);

    const firstField =
      (currentTabs[0]?.subTabs || [])[0]?.fields?.[0] ||
      ({ fieldName: "General Policy Health", thresholdValue: "N/A" } as any);

    const policyData = {
      id: policyId,
      name: policyMeta.name,
      product: policyMeta.product,
      version: policyMeta.version,
      status: policyMeta.status,
      description: policyMeta.description,
      tabs: currentTabs,
    };

    const [{ data: marketData }, { data: structureData }, { data: consistencyData }] = await Promise.all([
      api.post("http://localhost:8000/api/agents/market-intelligence", {
        policy_type: policyMeta.product || "general",
        field: firstField.fieldName || "Policy Parameter",
        value: firstField.thresholdValue ?? firstField.fieldValues ?? "N/A",
        context: {
          policy_name: policyMeta.name,
          description: policyMeta.description,
          total_tabs: currentTabs.length,
        },
      }),
      api.post("http://localhost:8000/api/agents/structure-analysis", {
        policy_type: policyMeta.product || "general",
        policy_data: policyData,
      }),
      api.post("http://localhost:8000/api/agents/consistency-audit", {
        policy_type: policyMeta.product || "general",
        policy_data: policyData,
      }),
    ]);

    setReviewData({ market: marketData, structure: structureData, consistency: consistencyData });
    setLastReviewedAt(new Date().toLocaleTimeString());
    setReviewError(null);
    setReviewLoading(false);
  };

  useEffect(() => {
    if (!policyId) return;

    let isMounted = true;

    api.get(`/policy/${policyId}?_t=${Date.now()}`)
      .then(({ data }) => {
        if (!isMounted) return;
        setPolicyMeta({
          name: data?.data?.name,
          description: data?.data?.description,
          product: data?.data?.product,
          version: data?.data?.version,
          status: data?.data?.status,
          startDate: data?.data?.startDate || data?.data?.effectiveDate || data?.data?.createdAt,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setPolicyMeta({});
      });

    return () => {
      isMounted = false;
    };
  }, [policyId]);

  useEffect(() => {
    if (tabs.length === 0) {
      if (activeTabId !== null) {
        dispatch(setActiveTabId(null));
      }
      return;
    }

    const existsInCurrentPolicy = tabs.some((tab) => tab.id === activeTabId);
    if (!existsInCurrentPolicy) {
      dispatch(setActiveTabId(tabs[0].id));
    }
  }, [tabs, activeTabId, dispatch]);

  useEffect(() => {
    if (!policyId || tabs.length === 0) {
      setReviewData(null);
      setReviewError(null);
      setLastReviewedAt(null);
    }
  }, [policyId, tabs.length]);

  const handleFinalSubmit = async () => {
    if (!policyId) {
      toast.error("Invalid policy ID");
      return;
    }

    const loadingToast = toast.loading("Submitting policy to queue...");
    try {
      await api.post("/approval", { action: "SUBMIT", policyId });
      toast.success("Policy submitted for review!", { id: loadingToast });
      dispatch(setStep(1));
      router.push("/dashboard");
    } catch {
      toast.error("Failed to submit policy", { id: loadingToast });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-soft">
        <div className="animate-pulse font-semibold text-blue-700">Loading Policy Engine...</div>
      </div>
    );
  }

  if (role !== "MAKER") {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-soft">
        <div className="max-w-md rounded-xl border bg-white p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Read-only for this role</h2>
          <p className="mt-2 text-sm text-gray-500">Only MAKER can edit tabs, subtabs, and fields.</p>
          <button
            onClick={() => router.push(`/dashboard/policy/${policyId}`)}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white"
          >
            Back to Policy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-soft">
      <header className="animate-fade-in-down border-b bg-white/90 px-8 py-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>{showHeaderDetails && <h2 className="text-xl text-gray-500">Policy ID: {policyId}</h2>}</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHeaderDetails((prev) => !prev)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              <span className="inline-flex items-center gap-2">
                {showHeaderDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showHeaderDetails ? "Hide Details" : "Show Details"}
              </span>
            </button>

            <PolicyChatPopup
              currentPolicy={{
                id: policyId,
                name: policyMeta.name,
                description: policyMeta.description,
                product: policyMeta.product,
                version: policyMeta.version,
                status: policyMeta.status,
                startDate: policyMeta.startDate,
                tabs,
              }}
              policyId={policyId}
              onPolicyUpdate={() => window.location.reload()}
            />

            <button
              onClick={() => setShowFieldRail((prev) => !prev)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              <span className="inline-flex items-center gap-2">
                {showFieldRail ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                {showFieldRail ? "Hide Fields" : "Show Fields"}
              </span>
            </button>

            <button
              onClick={() => setIsSimOpen(true)}
              className="rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-all hover:bg-blue-50"
            >
              Test Rules
            </button>
            <button
              onClick={() => {
                setIsAnalysisPanelOpen((prev) => !prev);
                setIsDraftPanelOpen(false);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              {isAnalysisPanelOpen ? "Hide Analysis" : "Show Analysis"}
            </button>
            <button
              onClick={() => {
                setIsDraftPanelOpen((prev) => !prev);
                setIsAnalysisPanelOpen(false);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              {isDraftPanelOpen ? "Hide Draft" : "Show Draft"}
            </button>
            <button
              onClick={handleFinalSubmit}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              Create Policy
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div
          className={`animate-fade-in-down overflow-x-auto border-b bg-white/90 px-6 transition-all duration-300 backdrop-blur ${
            showHeaderDetails ? "max-h-24 py-3 opacity-100" : "max-h-0 border-b-0 py-0 opacity-0"
          }`}
        >
          <div className="flex items-center gap-2">
            <h3 className="mr-4 text-xs font-bold uppercase tracking-wider text-gray-400">Categories:</h3>
            <TabList
              tabs={tabs}
              activeId={validActiveTabId}
              onSelect={(id: string) => dispatch(setActiveTabId(id))}
              policyId={policyId}
            />
          </div>
        </div>

        <section className="relative flex flex-1 overflow-hidden">
          {showFieldRail && (
            <aside className="animate-slide-in-left w-80 overflow-y-auto border-r bg-white/90 p-4 backdrop-blur">
              <div className="sticky top-0 mb-3 border-b bg-white/90 pb-3 backdrop-blur">
                <h3 className="text-sm font-bold text-gray-900">Fields Explorer</h3>
                <p className="text-xs text-gray-500">All created fields, vertically listed</p>
              </div>

              <div className="space-y-3">
                {tabs.map((tab) => (
                  <div key={tab.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase text-blue-700">{tab.name}</p>
                    <div className="mt-2 space-y-2">
                      {(tab.subTabs ?? []).map((subTab) => (
                        <div key={subTab.id} className="rounded-md bg-gray-50 p-2">
                          <p className="text-xs font-semibold text-gray-700">{subTab.name}</p>
                          <ul className="mt-1 space-y-1">
                            {(subTab.fields ?? []).map((field: any) => (
                              <li key={field.id} className="border-l-2 border-blue-200 pl-2 text-xs text-gray-600">
                                <span className="font-semibold text-gray-800">{field.fieldName || "Unnamed"}</span>
                                <span className="text-gray-400"> {field.operator || "="} </span>
                                <span className="text-blue-700">{field.thresholdValue || field.fieldValues || "N/A"}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {tabs.length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-gray-400">
                    No tabs/fields yet. Use AI generator or add manually.
                  </div>
                )}
              </div>
            </aside>
          )}

          <div
            className={`flex-1 space-y-6 overflow-y-auto p-6 transition-all duration-300 ${
              isDraftPanelOpen || isAnalysisPanelOpen ? "lg:pr-172" : ""
            }`}
          >
            <div className="mx-auto max-w-4xl animate-fade-in-up">
              {validActiveTabId ? (
                <SubTabSection tabId={validActiveTabId as string} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-400 animate-fade-in">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">[]</div>
                  <p className="text-sm">Select a category from above to manage rules.</p>
                </div>
              )}
            </div>
          </div>

          <aside
            className={`absolute inset-y-0 right-0 z-20 w-full max-w-2xl border-l bg-white shadow-xl transition-transform duration-300 ${
              isDraftPanelOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="h-full overflow-y-auto p-4">
              <div className="mb-3 flex items-center justify-end">
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
              </div>
              <PolicyDraft
                data={{
                  name: policyMeta.name || `Policy ${policyId}`,
                  description: policyMeta.description,
                  product: policyMeta.product,
                  version: policyMeta.version,
                  status: policyMeta.status,
                  startDate: policyMeta.startDate,
                  tabs,
                }}
                viewMode={draftViewMode}
              />
            </div>
          </aside>

          <aside
            className={`absolute inset-y-0 right-0 z-20 w-full max-w-2xl border-l bg-white shadow-xl transition-transform duration-300 ${
              isAnalysisPanelOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Precautionary AI Review</h3>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-1 text-[11px] font-semibold ${reviewError ? "bg-red-100 text-red-700" : reviewLoading ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {reviewError ? "Review Failed" : reviewLoading ? "Review Running" : reviewData ? "Review Generated" : "Not Run"}
                    </span>
                    <button
                      onClick={() => {
                        runPrecautionaryReview(tabs).catch((error: any) => {
                          setReviewError(error?.message || "Failed to run 3-agent review");
                          setReviewLoading(false);
                        });
                      }}
                      className="rounded border px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-gray-500">{lastReviewedAt ? `Last updated at ${lastReviewedAt}` : "Manual mode: click Refresh to run analysis"}</p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  {reviewError ? <p className="text-xs text-red-600">{reviewError}</p> : null}

                  {!reviewData ? (
                    <p className="text-xs text-gray-500">Analysis is manual-only to save tokens. Click Refresh when needed.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded border bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-800">Market Analyst</p>
                        <p className="mt-1 text-xs text-gray-700">{reviewData.market?.risk_score || "No risk score"}</p>
                        <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1 text-[11px] text-gray-600">
                          {normalizeList(reviewData.market?.recommendations).slice(0, 5).map((item, idx) => (
                            <li key={`mr-panel-${idx}`}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded border bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-800">Structure Analyst</p>
                        <p className="mt-1 text-xs text-gray-700">{reviewData.structure?.completeness_score || "No score"}</p>
                        <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1 text-[11px] text-gray-600">
                          {normalizeList(reviewData.structure?.improvements).slice(0, 5).map((item, idx) => (
                            <li key={`sr-panel-${idx}`}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded border bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-800">Consistency Auditor</p>
                        <p className="mt-1 text-xs text-gray-700">{reviewData.consistency?.status || "No status"}</p>
                        <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1 text-[11px] text-gray-600">
                          {normalizeList(reviewData.consistency?.corrections).slice(0, 5).map((item, idx) => (
                            <li key={`cr-panel-${idx}`}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </section>

        {isSimOpen && (
          <div className="absolute inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
            <div className="animate-slide-in-right relative w-full max-w-md">
              <button
                onClick={() => setIsSimOpen(false)}
                className="absolute -left-10 top-4 rounded-l-md border-y border-l bg-white p-2 shadow-md"
              >
                X
              </button>
              <SimulationSheet policyId={policyId} fields={allFields} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
