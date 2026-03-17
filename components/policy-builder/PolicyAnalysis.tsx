"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Shield, CheckCircle } from "lucide-react";
import api from "@/lib/api";

interface PolicyAnalysisProps {
  policyData: any;
  policyId: string;
}

export default function PolicyAnalysis({ policyData, policyId }: PolicyAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<string>("full");

  const runAnalysis = async (type: string) => {
    setLoading(true);
    setActiveAnalysis(type);
    try {
      const { data } = await api.post("http://localhost:8000/api/policy-analysis/analyze", {
        policy_json: policyData,
        analysis_type: type
      });
      setResults(data);
    } catch (error) {
      console.error("Analysis failed:", error);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield size={20} />
          AI Policy Analysis
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => runAnalysis("structure")} disabled={loading}>
            <CheckCircle size={16} className="mr-1" />
            Structure
          </Button>
          <Button size="sm" onClick={() => runAnalysis("consistency")} disabled={loading}>
            <Shield size={16} className="mr-1" />
            Consistency
          </Button>
          <Button size="sm" onClick={() => runAnalysis("market")} disabled={loading}>
            <TrendingUp size={16} className="mr-1" />
            Market
          </Button>
          <Button size="sm" onClick={() => runAnalysis("full")} disabled={loading}>
            {loading ? <Loader2 size={16} className="mr-1 animate-spin" /> : "Full Analysis"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="animate-spin mx-auto mb-2" />
            <p>Running {activeAnalysis} analysis...</p>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            {results.structure_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Structure Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Badge variant="outline">{results.structure_analysis.completeness_score}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Missing Components:</h4>
                    <ul className="text-sm space-y-1">
                      {results.structure_analysis.missing_components?.map((item: string, i: number) => (
                        <li key={i} className="text-red-600">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Improvements:</h4>
                    <ul className="text-sm space-y-1">
                      {results.structure_analysis.improvements?.map((item: string, i: number) => (
                        <li key={i} className="text-blue-600">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {results.consistency_audit && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consistency Audit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Badge variant={results.consistency_audit.status?.includes("Pass") ? "default" : "destructive"}>
                      {results.consistency_audit.status}
                    </Badge>
                    <Badge variant="outline" className="ml-2">{results.consistency_audit.risk_level}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Issues Found:</h4>
                    <ul className="text-sm space-y-1">
                      {results.consistency_audit.issues?.map((item: string, i: number) => (
                        <li key={i} className="text-red-600">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Corrections:</h4>
                    <ul className="text-sm space-y-1">
                      {results.consistency_audit.corrections?.map((item: string, i: number) => (
                        <li key={i} className="text-green-600">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {results.market_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Market Intelligence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.market_analysis.map((field: any, i: number) => (
                    <div key={i} className="border rounded p-3">
                      <h4 className="font-medium mb-2">Field: {field.field}</h4>
                      <div className="space-y-2">
                        <div>
                          <Badge variant="outline">{field.analysis.risk_score}</Badge>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium">Market Standards:</h5>
                          <p className="text-sm text-gray-600">{field.analysis.market_standards}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium">Benchmark Comparison:</h5>
                          <p className="text-sm text-gray-600">{field.analysis.benchmark_comparison}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium">Recommendations:</h5>
                          <ul className="text-sm space-y-1">
                            {field.analysis.recommendations?.map((rec: string, j: number) => (
                              <li key={j} className="text-blue-600">• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}