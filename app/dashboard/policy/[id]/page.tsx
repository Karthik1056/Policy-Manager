"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Plus, History } from "lucide-react";
import Link from "next/link";
import GenerateAIDoc from "@/components/policy-builder/GenerateAIDoc";
import DownloadPolicyDoc from "@/components/policy-builder/DownloadPolicyDoc";
import PolicyQueryEngine from "@/components/policy-builder/PolicyQueryEngine";

export default function PolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params && params.id) {
      fetch(`/api/policy/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setPolicy(data.data);
          setLoading(false);
        });
    }
  }, [params]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!policy) return <div className="p-8">Policy not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
            Back to Policies
          </button>
          <div className="flex gap-3">
            <PolicyQueryEngine policyId={policy.id} />
            <GenerateAIDoc policyId={policy.id} policyName={policy.name} />
            <DownloadPolicyDoc policyId={policy.id} policyName={policy.name} />
            <Link href={`/dashboard/policy/${params?.id}/versions`} className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50">
              <History size={16} />
              View Versions
            </Link>
            <Link href={`/dashboard/maker/${params?.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <Edit size={16} />
              Edit Policy
            </Link>
            <button className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-red-50 text-red-600">
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{policy.name}</h1>
              <p className="text-sm text-gray-500 mt-2">Policy ID: {policy.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              policy.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
              policy.status === "DRAFT" ? "bg-gray-100 text-gray-700" :
              "bg-orange-100 text-orange-700"
            }`}>
              {policy.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Product Type</p>
              <p className="text-lg font-semibold text-gray-900">{policy.product || "N/A"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Version</p>
              <p className="text-lg font-semibold text-gray-900">{policy.version || "v1.0"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Last Modified</p>
              <p className="text-lg font-semibold text-gray-900">{new Date(policy.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Policy Flow</h2>
          
          <div className="flex flex-col items-center space-y-6">
            <button className="px-6 py-3 bg-gray-900 text-white rounded-full font-semibold">
              START
            </button>

            {policy.tabs?.map((tab: any, tabIndex: number) => (
              <div key={tab.id} className="w-full max-w-4xl">
                <div className="flex justify-center mb-4">
                  <div className="w-px h-8 bg-gray-300"></div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="text-sm font-bold text-blue-600 uppercase mb-4">{tab.name}</h3>
                  
                  {tab.subTabs?.map((subTab: any, subTabIndex: number) => (
                    <div key={subTab.id} className="mb-4 last:mb-0">
                      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                        <div className="space-y-3">
                          {subTab.fields?.map((field: any, fieldIndex: number) => (
                            <div key={field.id}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                  {fieldIndex + 1}
                                </div>
                                <div className="flex-1 bg-gray-50 rounded-lg p-3 border">
                                  <div className="flex items-center gap-4">
                                    <span className="font-semibold text-gray-900">{field.fieldName}</span>
                                    <span className="text-gray-500">{field.operator || "="}</span>
                                    <span className="font-semibold text-blue-600">{field.thresholdValue || field.fieldValues || "N/A"}</span>
                                  </div>
                                </div>
                                <button className="p-2 hover:bg-gray-100 rounded">
                                  <Trash2 size={14} className="text-gray-400" />
                                </button>
                              </div>
                              {fieldIndex < (subTab.fields?.length || 0) - 1 && (
                                <div className="flex justify-center py-2">
                                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded">AND</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      {subTabIndex < (tab.subTabs?.length || 0) - 1 && (
                        <div className="flex justify-center py-3">
                          <span className="px-3 py-1 bg-gray-700 text-white text-xs font-bold rounded">AND</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-center my-6">
                  <div className="flex gap-8">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-12 bg-green-400"></div>
                      <span className="px-4 py-1 bg-green-100 text-green-700 text-xs font-bold rounded mb-2">IF MATCHES</span>
                      <div className="w-px h-12 bg-green-400"></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-px h-12 bg-gray-300"></div>
                      <span className="px-4 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded mb-2">ELSE</span>
                      <div className="w-px h-12 bg-gray-300"></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="flex justify-center">
                    <div className="bg-green-100 border-2 border-green-500 rounded-lg p-6 w-full max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-green-900">Approve</p>
                          <p className="text-xs text-green-700">Tier 1 Interest Rate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="bg-orange-100 border-2 border-orange-500 rounded-lg p-6 w-full max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-orange-900">Manual Review</p>
                          <p className="text-xs text-orange-700">Assign to Underwriter</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {(!policy.tabs || policy.tabs.length === 0) && (
              <div className="text-center py-16 border-2 border-dashed rounded-lg bg-gray-50 w-full">
                <p className="text-gray-400 text-sm mb-4">No policy rules defined yet</p>
                <Link href={`/dashboard/maker/${params?.id}/build`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus size={16} />
                  Add Rules
                </Link>
              </div>
            )}

            <button className="px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center gap-2">
              <Plus size={16} />
              Add New Logic Block
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
