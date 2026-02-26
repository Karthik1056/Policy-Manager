"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveTabId, setStep } from "@/store/slices/policySlice";
import { useTabs } from "@/hooks/useHierarchy";
import api from "@/lib/api";
import toast from "react-hot-toast";
import type { Tab } from "@/types";

import TabList from "@/components/policy-builder/TabList";
import SubTabSection from "@/components/policy-builder/SubTabSection";
import PolicySummary from "@/components/policy-builder/PolicySummary";
import SimulationSheet from "@/components/simulation/SimulationSheet";
import Stepper from "@/components/layout/Stepper";

type Field = Record<string, unknown>;
type SubTab = { fields?: Field[] | null };

export default function BuildPolicyPage() {
  const params = useParams<{ id: string | string[] }>();
  const policyId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";

  const router = useRouter();
  const dispatch = useAppDispatch();

  const [isSimOpen, setIsSimOpen] = useState(false);
  const activeTabId = useAppSelector((state) => state.policy.activeTabId);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-pulse text-blue-600 font-semibold">Loading Policy Engine...</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen bg-gray-50 overflow-hidden">
      <header className="bg-white border-b px-8 py-4 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Policy Builder</h1>
            <p className="text-xs text-gray-500">Policy ID: {policyId}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsSimOpen(true)}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-all"
            >
              Test Rules (Simulation)
            </button>
            <button
              onClick={handleFinalSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
            >
              Submit for Approval
            </button>
          </div>
        </div>
        <Stepper />
      </header>

      <main className="flex flex-col flex-1 overflow-hidden">
        <div className="bg-white border-b px-6 py-3 overflow-x-auto">
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

        <section className="flex flex-1 bg-gray-50 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {activeTabId ? (
              <div className="max-w-5xl mx-auto">
                <SubTabSection tabId={activeTabId as string} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">📂</div>
                <p className="text-sm">Select a category from above to manage rules.</p>
              </div>
            )}
          </div>
          
          {activeTabId && <PolicySummary tabId={activeTabId as string} />}
        </section>

        {isSimOpen && (
          <div className="absolute inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
            <div className="relative w-full max-w-md animate-in slide-in-from-right duration-300">
              <button
                onClick={() => setIsSimOpen(false)}
                className="absolute left-[-40px] top-4 bg-white p-2 rounded-l-md shadow-md border-y border-l"
              >
                ✕
              </button>
              <SimulationSheet policyId={policyId} fields={allFields} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
