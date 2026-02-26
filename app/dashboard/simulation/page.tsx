"use client";

import { useState, useEffect } from "react";
import { Search, Play, FileText, ChevronRight } from "lucide-react";

export default function SimulationPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [simulationData, setSimulationData] = useState<Record<string, string>>({});
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetch("/api/policy/getAll")
      .then((res) => res.json())
      .then((data) => {
        setPolicies(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredPolicies = policies.filter((policy) =>
    policy.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePolicySelect = async (policy: any) => {
    setSelectedPolicy(policy);
    setSimulationResult(null);
    setSimulationData({});
    
    // Fetch full policy details with tabs/fields
    fetch(`/api/policy/${policy.id}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedPolicy(data.data);
      });
  };

  const handleSimulate = async () => {
    if (!selectedPolicy) return;
    
    setSimulating(true);
    try {
      const response = await fetch("/api/approval/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId: selectedPolicy.id,
          testData: simulationData,
        }),
      });
      
      const result = await response.json();
      if (response.ok) {
        const results = result.data;
        const hasKnockout = results?.some((r: any) => r.status === "KNOCKOUT");
        setSimulationResult({
          approved: !hasKnockout,
          message: hasKnockout ? "Policy conditions not met" : "All conditions passed",
          details: results
        });
      } else {
        setSimulationResult({ approved: false, message: result.message || "Simulation failed" });
      }
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setSimulating(false);
    }
  };

  const getAllFields = () => {
    if (!selectedPolicy?.tabs) return [];
    const fields: any[] = [];
    selectedPolicy.tabs.forEach((tab: any) => {
      tab.subTabs?.forEach((subTab: any) => {
        subTab.fields?.forEach((field: any) => {
          fields.push(field);
        });
      });
    });
    return fields;
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Policy Simulation</h1>
        <p className="text-sm text-gray-500 mt-1">Test policies with sample data</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Policy Selection */}
        <div className="col-span-1 bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Policy</h2>
          
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search policies..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No policies found</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredPolicies.map((policy) => (
                <button
                  key={policy.id}
                  onClick={() => handlePolicySelect(policy)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedPolicy?.id === policy.id
                      ? "bg-blue-50 border-blue-500"
                      : "hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{policy.name}</p>
                      <p className="text-xs text-gray-500">{policy.version}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Simulation Form */}
        <div className="col-span-2 bg-white rounded-xl border shadow-sm p-6">
          {!selectedPolicy ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FileText size={48} className="mb-4" />
              <p>Select a policy to start simulation</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedPolicy.name}</h2>
                <p className="text-sm text-gray-500">Enter test data for simulation</p>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {getAllFields().map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.fieldName}
                      {field.operator && field.thresholdValue && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({field.operator} {field.thresholdValue})
                        </span>
                      )}
                    </label>
                    <input
                      type={field.fieldType === "number" ? "number" : "text"}
                      value={simulationData[field.fieldName] || ""}
                      onChange={(e) =>
                        setSimulationData({
                          ...simulationData,
                          [field.fieldName]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900"
                      placeholder={`Enter ${field.fieldName}`}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSimulate}
                disabled={simulating || getAllFields().length === 0}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
              >
                <Play size={16} />
                {simulating ? "Running Simulation..." : "Run Simulation"}
              </button>

              {simulationResult && (
                <div className={`p-4 rounded-lg border-2 ${
                  simulationResult.approved
                    ? "bg-green-50 border-green-500"
                    : "bg-red-50 border-red-500"
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    simulationResult.approved ? "text-green-900" : "text-red-900"
                  }`}>
                    Result: {simulationResult.approved ? "APPROVED" : "REJECTED"}
                  </h3>
                  <p className="text-sm text-gray-700">
                    {simulationResult.message || "Simulation completed"}
                  </p>
                  {simulationResult.details && (
                    <div className="mt-2 text-xs text-gray-600">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(simulationResult.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
