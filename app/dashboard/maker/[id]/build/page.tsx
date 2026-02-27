"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveTabId, setStep } from "@/store/slices/policySlice";
import { useTabs } from "@/hooks/useHierarchy";
import api from "@/lib/api";
import toast from "react-hot-toast";
import type { Tab } from "@/types";
import { ChevronDown, ChevronUp, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";

import TabList from "@/components/policy-builder/TabList";
import SubTabSection from "@/components/policy-builder/SubTabSection";
import PolicySummary from "@/components/policy-builder/PolicySummary";
import SimulationSheet from "@/components/simulation/SimulationSheet";
import AIGeneratePolicy from "@/components/policy-builder/AIGeneratePolicy";
import { unwrapApiData } from "@/lib/unwrapApiData";

type Field = {
  id?: string;
  fieldName?: string;
  operator?: string;
  thresholdValue?: string;
  fieldValues?: string;
};

export default function BuildPolicyPage() {
  const params = useParams<{ id: string | string[] }>();
  const policyId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";

  const router = useRouter();
  const dispatch = useAppDispatch();

  const [isSimOpen, setIsSimOpen] = useState(false);
  const [showFieldRail, setShowFieldRail] = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [showHeaderDetails, setShowHeaderDetails] = useState(true);
  const activeTabId = useAppSelector((state) => state.policy.activeTabId);
  const role = String(useAppSelector((state) => state.auth.user?.role || "")).toUpperCase();

  const { data: tabsData, isLoading } = useTabs(policyId);
  const tabs = (tabsData ?? []) as Tab[];

  const allFields = useMemo(
    () =>
      tabs
        .flatMap((t) => t.subTabs ?? [])
        .flatMap((st) => st.fields ?? [])
        .filter(Boolean),
    [tabs]
  );

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

  const handleAIGenerated = async (structure: any) => {
    if (!policyId) {
      toast.error("Invalid policy ID");
      return;
    }

    const loadingToast = toast.loading("Creating policy structure...");
    try {
      for (const tab of structure.tabs) {
        const tabRes = await api.post("/tab/createTab", {
          name: tab.name,
          documentNotes: tab.documentNotes,
          policyEngineId: policyId,
          orderIndex: structure.tabs.indexOf(tab),
        });
        const tabData = unwrapApiData(tabRes.data);

        for (const subTab of tab.subTabs) {
          const subTabRes = await api.post("/subtab/create", {
            name: subTab.name,
            documentNotes: subTab.documentNotes,
            tabId: tabData.id,
            orderIndex: tab.subTabs.indexOf(subTab),
          });
          const subTabData = unwrapApiData(subTabRes.data);

          for (const field of subTab.fields) {
            await api.post("/field/create", {
              ...field,
              subTabId: subTabData.id,
              orderIndex: subTab.fields.indexOf(field),
            });
          }
        }
      }

      toast.success("Policy structure created!", { id: loadingToast });
      window.location.reload();
    } catch (error) {
      toast.error("Failed to create structure", { id: loadingToast });
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-soft">
        <div className="animate-pulse text-blue-700 font-semibold">Loading Policy Engine...</div>
      </div>
    );
  }

  if (role !== "MAKER") {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-soft">
        <div className="bg-white border rounded-xl p-6 text-center max-w-md">
          <h2 className="text-lg font-semibold text-gray-900">Read-only for this role</h2>
          <p className="text-sm text-gray-500 mt-2">Only MAKER can edit tabs, subtabs, and fields.</p>
          <button
            onClick={() => router.push(`/dashboard/policy/${policyId}`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Back to Policy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen bg-gradient-soft overflow-hidden">
      <header className="bg-white/90 backdrop-blur border-b px-8 py-4 shadow-sm animate-fade-in-down">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Policy Builder</h1>
            {showHeaderDetails && <p className="text-xs text-gray-500">Policy ID: {policyId}</p>}
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setShowHeaderDetails((prev) => !prev)}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-all"
            >
              <span className="inline-flex items-center gap-2">
                {showHeaderDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showHeaderDetails ? "Hide Details" : "Show Details"}
              </span>
            </button>

            <button
              onClick={() => setShowFieldRail((prev) => !prev)}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-all"
            >
              <span className="inline-flex items-center gap-2">
                {showFieldRail ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                {showFieldRail ? "Hide Fields" : "Show Fields"}
              </span>
            </button>

            <button
              onClick={() => setIsSimOpen(true)}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-all"
            >
              Test Rules
            </button>
            <button
              onClick={handleFinalSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
            >
              Create Policy
            </button>
            <button
              onClick={() => setShowSummary((prev) => !prev)}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-all"
              disabled={!activeTabId}
            >
              {showSummary ? "Hide Summary" : "Show Summary"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col flex-1 overflow-hidden">
        <div className={`bg-white/90 backdrop-blur border-b px-6 overflow-x-auto animate-fade-in-down transition-all duration-300 ${showHeaderDetails ? "max-h-24 py-3 opacity-100" : "max-h-0 py-0 opacity-0 border-b-0"}`}>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-4">Categories:</h3>
            <TabList
              tabs={tabs}
              activeId={activeTabId}
              onSelect={(id: string) => dispatch(setActiveTabId(id))}
              policyId={policyId}
            />
          </div>
        </div>

        <section className="flex flex-1 overflow-hidden">
          {showFieldRail && (
            <aside className="w-80 border-r bg-white/90 backdrop-blur overflow-y-auto p-4 animate-slide-in-left">
              <div className="sticky top-0 bg-white/90 backdrop-blur pb-3 mb-3 border-b">
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
                            {(subTab.fields ?? []).map((field: Field) => (
                              <li key={field.id} className="text-xs text-gray-600 border-l-2 border-blue-200 pl-2">
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
                  <div className="text-xs text-gray-400 border border-dashed rounded-lg p-4 text-center">
                    No tabs/fields yet. Use AI generator or add manually.
                  </div>
                )}
              </div>
            </aside>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="max-w-5xl mx-auto animate-fade-in-up">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  <Sparkles size={14} />
                  AI Assisted Creation
                </div>
              </div>
              <AIGeneratePolicy onGenerated={handleAIGenerated} inline />
            </div>

            {activeTabId ? (
              <div className="max-w-5xl mx-auto animate-fade-in-up">
                <SubTabSection tabId={activeTabId as string} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">[]</div>
                <p className="text-sm">Select a category from above to manage rules.</p>
              </div>
            )}
          </div>

          {activeTabId && showSummary && <PolicySummary tabId={activeTabId as string} />}
        </section>

        {isSimOpen && (
          <div className="absolute inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
            <div className="relative w-full max-w-md animate-slide-in-right">
              <button
                onClick={() => setIsSimOpen(false)}
                className="absolute left-[-40px] top-4 bg-white p-2 rounded-l-md shadow-md border-y border-l"
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
