"use client";

import { useState, useRef, useEffect } from "react";
import { useApprovalQueue, useProcessApproval } from "@/hooks/useChecker";
import { Clock, FileText, MoreVertical, Eye, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CheckerQueuePage() {
  const router = useRouter();
  const { data: queue = [], isLoading } = useApprovalQueue();
  const processApproval = useProcessApproval();
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDecision = (policyId: string, action: "APPROVE" | "REJECT") => {
    processApproval.mutate({
      policyId,
      action,
      notes,
    }, {
      onSuccess: () => {
        setSelectedPolicy(null);
        setNotes("");
      }
    });
  };

  // Helper function to find policy by id
  const getPolicyById = (id: string) => queue.find(q => q.id === id);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approval Queue</h1>
          <p className="text-sm text-gray-500 mt-1">Review and process pending policy submissions</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <Clock size={16} className="text-orange-600" />
          <span className="text-sm font-medium text-orange-900">{queue.length} Pending</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs font-semibold text-gray-500 uppercase">
              <th className="pb-3 w-8"><input type="checkbox" /></th>
              <th className="pb-3">Policy Name</th>
              <th className="pb-3">Version</th>
              <th className="pb-3">Submitter</th>
              <th className="pb-3">Current Level</th>
              <th className="pb-3">Time in Queue</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : queue.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No policies pending approval</td></tr>
            ) : (
              queue.map((item) => {
                const timeInQueue = Math.floor((Date.now() - new Date(item.timeInQueue).getTime()) / (1000 * 60));
                const hours = Math.floor(timeInQueue / 60);
                const minutes = timeInQueue % 60;
                const isUrgent = hours >= 2;

                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-4"><input type="checkbox" /></td>
                    <td className="py-4">
                      <div className="font-semibold text-gray-900">{item.policyEngine?.name || "N/A"}</div>
                      <div className="text-xs text-gray-500">ID: {item.policyEngineId?.slice(0, 12) || "N/A"}</div>
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                        v{item.policyEngine?.version || "1.0"}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                          {item.policyEngine?.maker?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.policyEngine?.maker?.name || "Unknown"}</div>
                          <div className="text-xs text-gray-500">{item.policyEngine?.maker?.role || "Maker"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.currentLevel === "LEVEL_1_REVIEW" ? "bg-blue-100 text-blue-700" :
                        item.currentLevel === "LEVEL_2_REVIEW" ? "bg-purple-100 text-purple-700" :
                        "bg-teal-100 text-teal-700"
                      }`}>
                        {item.currentLevel === "LEVEL_1_REVIEW" ? "Risk Manager Review" :
                         item.currentLevel === "LEVEL_2_REVIEW" ? "Compliance Check" :
                         "Legal Review"}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        {isUrgent && <span className="text-orange-500">⚠</span>}
                        <span className={isUrgent ? "text-orange-600 font-medium" : "text-gray-600"}>
                          {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/policy/${item.policyEngineId}`)}
                          className="p-2 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <div className="relative" ref={openDropdown === item.id ? dropdownRef : null}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                          >
                            <MoreVertical size={16} className="text-gray-400" />
                          </button>
                          {openDropdown === item.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                              <button
                                onClick={() => {
                                  router.push(`/dashboard/policy/${item.policyEngineId}`);
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                              >
                                <Eye size={14} />
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPolicy(item.id);
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600 border-t"
                              >
                                <CheckCircle size={14} />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPolicy(item.id);
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600 rounded-b-lg"
                              >
                                <XCircle size={14} />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedPolicy(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Decision</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Review Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your review comments..."
                className="w-full rounded-lg border px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleDecision(getPolicyById(selectedPolicy)?.policyEngineId || "", "APPROVE")}
                disabled={processApproval.isPending}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle size={16} />
                Approve
              </button>
              <button
                onClick={() => handleDecision(getPolicyById(selectedPolicy)?.policyEngineId || "", "REJECT")}
                disabled={processApproval.isPending}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle size={16} />
                Reject
              </button>
            </div>
            <button
              onClick={() => setSelectedPolicy(null)}
              className="w-full mt-3 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
