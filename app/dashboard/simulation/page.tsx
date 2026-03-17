"use client";

import { useState, useEffect } from "react";
import { Search, Play, FileText, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

export default function SimulationPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [simulationData, setSimulationData] = useState<Record<string, string>>({});
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    api.get("/policy/getAll").then(({ data }) => {
      setPolicies(data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredPolicies = policies.filter((policy) =>
    policy.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePolicySelect = async (policy: any) => {
    setSelectedPolicy(policy);
    setSimulationResult(null);
    setSimulationData({});
    api.get(`/policy/${policy.id}`).then(({ data }) => {
      setSelectedPolicy(data.data);
    });
  };

  const handleSimulate = async () => {
    if (!selectedPolicy) return;
    
    setSimulating(true);
    try {
      const { data: result } = await api.post("/approval/simulate", {
        policyId: selectedPolicy.id,
        testData: simulationData,
      });
      const results = result.data;
      const hasKnockout = results?.some((r: any) => r.status === "KNOCKOUT");
      setSimulationResult({
        approved: !hasKnockout,
        message: hasKnockout ? "Policy conditions not met" : "All conditions passed",
        details: results
      });
    } catch (error: any) {
      setSimulationResult({ approved: false, message: error?.response?.data?.message || "Simulation failed" });
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
        <Card>
          <CardHeader>
            <CardTitle>Select Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  placeholder="Search policies..."
                  className="pl-9"
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
                  <Button
                    key={policy.id}
                    variant={selectedPolicy?.id === policy.id ? "default" : "outline"}
                    className="w-full justify-between"
                    onClick={() => handlePolicySelect(policy)}
                  >
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{policy.name}</p>
                      <p className="text-xs opacity-70">{policy.version}</p>
                    </div>
                    <ChevronRight size={16} />
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardContent className="p-6">
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
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>
                        {field.fieldName}
                        {field.operator && field.thresholdValue && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({field.operator} {field.thresholdValue})
                          </span>
                        )}
                      </Label>
                      <Input
                        id={field.id}
                        type={field.fieldType === "number" ? "number" : "text"}
                        value={simulationData[field.fieldName] || ""}
                        onChange={(e) =>
                          setSimulationData({
                            ...simulationData,
                            [field.fieldName]: e.target.value,
                          })
                        }
                        placeholder={`Enter ${field.fieldName}`}
                      />
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleSimulate}
                  disabled={simulating || getAllFields().length === 0}
                  className="w-full"
                >
                  <Play size={16} className="mr-2" />
                  {simulating ? "Running Simulation..." : "Run Simulation"}
                </Button>

                {simulationResult && (
                  <Card className={simulationResult.approved ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}>
                    <CardContent className="p-4">
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
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
