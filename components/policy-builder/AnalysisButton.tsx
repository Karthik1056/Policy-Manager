"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, TrendingUp, Shield, CheckCircle, BarChart3 } from "lucide-react";
import api from "@/lib/api";

interface AnalysisButtonProps {
  policyData: any;
  policyId: string;
}

export default function AnalysisButton({ policyData, policyId }: AnalysisButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setIsOpen(true);
    try {
      const { data } = await api.post("http://localhost:8000/api/policy-analysis/analyze", {
        policy_json: policyData,
        analysis_type: "full"
      });
      setResults(data);
    } catch (error) {
      console.error("Analysis failed:", error);
    }
    setLoading(false);
  };

  return (
    <>
      <Button onClick={runAnalysis} className="bg-linear-to-r from-green-600 to-blue-600">
        <BarChart3 size={16} className="mr-2" />
        AI Analysis
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[80vw] max-w-[80vw] sm:max-w-[80vw] max-h-[90vh] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              Precautionary AI Review (Build Stage)
            </DialogTitle>
            <p className="text-sm text-gray-500">Last updated at {new Date().toLocaleTimeString()}</p>
          </DialogHeader>

          {loading && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto mb-2" />
              <p>Running full analysis...</p>
            </div>
          )}

          {results && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-x-hidden">
              {results.market_analysis && (
                <div className="min-w-0 border border-slate-300 rounded-lg p-5 overflow-x-hidden">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp size={18} className="text-green-600" />
                    Market Analyst
                  </h3>
                  <div className="space-y-3">
                    <Badge variant="outline" className="max-w-full h-auto whitespace-normal text-xs leading-snug wrap-break-word">
                      {results.market_analysis.risk_score}
                    </Badge>
                    <div className="text-sm text-gray-700 wrap-break-word">
                      {results.market_analysis.market_standards}
                    </div>
                    <div className="text-sm text-gray-700 wrap-break-word">
                      {results.market_analysis.benchmark_comparison}
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-2">Recommendations:</p>
                      <ul className="space-y-1">
                        {results.market_analysis.recommendations?.map((rec: string, i: number) => (
                          <li key={i} className="text-sm text-blue-600 wrap-break-word">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {results.structure_analysis && (
                <div className="min-w-0 border border-slate-300 rounded-lg p-5 overflow-x-hidden">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-blue-600" />
                    Structure Analyst
                  </h3>
                  <div className="space-y-3">
                    <Badge variant="outline" className="max-w-full h-auto whitespace-normal text-xs leading-snug wrap-break-word">
                      {results.structure_analysis.completeness_score}
                    </Badge>
                    <div>
                      <p className="text-sm font-semibold mb-2">Missing Components:</p>
                      <ul className="space-y-1">
                        {results.structure_analysis.missing_components?.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-red-600 wrap-break-word">• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-2">Improvements:</p>
                      <ul className="space-y-1">
                        {results.structure_analysis.improvements?.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-blue-600 wrap-break-word">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {results.consistency_audit && (
                <div className="min-w-0 border border-slate-300 rounded-lg p-5 overflow-x-hidden">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Shield size={18} className="text-orange-600" />
                    Consistency Auditor
                  </h3>
                  <div className="space-y-3">
                    <Badge
                      variant={results.consistency_audit.status?.includes("Pass") ? "default" : "destructive"}
                      className="max-w-full h-auto whitespace-normal text-xs leading-snug wrap-break-word"
                    >
                      {results.consistency_audit.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-semibold mb-2">Issues Found:</p>
                      <ul className="space-y-1">
                        {results.consistency_audit.issues?.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-red-600 wrap-break-word">• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-2">Corrections:</p>
                      <ul className="space-y-1">
                        {results.consistency_audit.corrections?.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-green-600 wrap-break-word">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}