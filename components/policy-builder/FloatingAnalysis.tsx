"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Shield, CheckCircle, X, Minimize2, BarChart3 } from "lucide-react";
import api from "@/lib/api";

interface FloatingAnalysisProps {
  policyData: any;
  policyId: string;
}

export default function FloatingAnalysis({ policyData, policyId }: FloatingAnalysisProps) {
  const [mounted, setMounted] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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

  if (!mounted) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-1/2 left-0 translate-y-1/2 w-12 h-24 bg-gradient-to-r from-green-600 to-blue-600 rounded-r-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center text-white z-50 hover:w-14 gap-1"
        >
          <BarChart3 size={20} />
          <span className="text-xs font-medium writing-mode-vertical">Analysis</span>
        </button>
      )}

      {isOpen && (
        <div className={`fixed top-0 left-0 h-screen bg-white shadow-2xl z-50 flex flex-col transition-all ${isMinimized ? 'w-16' : 'w-96'}`}>
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Analysis</h3>
                <p className="text-xs opacity-90">Policy Review</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-white/20 p-1 rounded">
                <Minimize2 size={18} />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="p-4 border-b">
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={() => runAnalysis("structure")} disabled={loading} variant="outline">
                    <CheckCircle size={14} className="mr-1" />
                    Structure
                  </Button>
                  <Button size="sm" onClick={() => runAnalysis("consistency")} disabled={loading} variant="outline">
                    <Shield size={14} className="mr-1" />
                    Consistency
                  </Button>
                  <Button size="sm" onClick={() => runAnalysis("market")} disabled={loading} variant="outline">
                    <TrendingUp size={14} className="mr-1" />
                    Market
                  </Button>
                  <Button size="sm" onClick={() => runAnalysis("full")} disabled={loading}>
                    {loading ? <Loader2 size={14} className="mr-1 animate-spin" /> : "Full Analysis"}
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loading && (
                  <div className="text-center py-8">
                    <Loader2 className="animate-spin mx-auto mb-2" />
                    <p className="text-sm">Running {activeAnalysis} analysis...</p>
                  </div>
                )}

                {results && (
                  <div className="space-y-4">
                    {results.structure_analysis && (
                      <Card className="border-blue-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle size={16} />
                            Structure Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                          <Badge variant="outline" className="text-xs">{results.structure_analysis.completeness_score}</Badge>
                          <div>
                            <p className="font-medium mb-1">Missing Components:</p>
                            <ul className="space-y-1">
                              {results.structure_analysis.missing_components?.map((item: string, i: number) => (
                                <li key={i} className="text-red-600">• {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Improvements:</p>
                            <ul className="space-y-1">
                              {results.structure_analysis.improvements?.map((item: string, i: number) => (
                                <li key={i} className="text-blue-600">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {results.consistency_audit && (
                      <Card className="border-orange-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Shield size={16} />
                            Consistency Audit
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                          <div className="flex gap-2">
                            <Badge variant={results.consistency_audit.status?.includes("Pass") ? "default" : "destructive"} className="text-xs">
                              {results.consistency_audit.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{results.consistency_audit.risk_level}</Badge>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Issues Found:</p>
                            <ul className="space-y-1">
                              {results.consistency_audit.issues?.map((item: string, i: number) => (
                                <li key={i} className="text-red-600">• {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Corrections:</p>
                            <ul className="space-y-1">
                              {results.consistency_audit.corrections?.map((item: string, i: number) => (
                                <li key={i} className="text-green-600">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {results.market_analysis && (
                      <Card className="border-green-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp size={16} />
                            Market Intelligence
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs">
                          <div>
                            <Badge variant="outline" className="text-xs">{results.market_analysis.risk_score}</Badge>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Market Standards:</p>
                            <p className="text-gray-600">{results.market_analysis.market_standards}</p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Benchmark Comparison:</p>
                            <p className="text-gray-600">{results.market_analysis.benchmark_comparison}</p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Recommendations:</p>
                            <ul className="space-y-1">
                              {results.market_analysis.recommendations?.map((rec: string, j: number) => (
                                <li key={j} className="text-blue-600">• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {!results && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">Select an analysis type to begin</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}