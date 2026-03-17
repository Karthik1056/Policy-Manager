"use client";

import { ChevronDown, ChevronUp, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface PolicyQueryEngineProps {
    policyId: string;
}

export default function PolicyQueryEngine({ policyId }: PolicyQueryEngineProps) {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleQuery = async () => {
        if (!query.trim()) {
            toast.error("Please enter a query");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post(`/policy/${policyId}/query`, { query });
            setResult(data.data);
            toast.success("Query evaluated!");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error.message || "Failed to evaluate query");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-fade-in-up">
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <MessageSquare size={17} className="text-green-700" />
                    <span className="font-semibold text-gray-900">Policy Query Engine</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <div className={`transition-all duration-300 ease-out ${isOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="px-5 pb-5 border-t bg-gradient-to-b from-white to-green-50/40">
                    <p className="text-sm text-gray-600 mt-4 mb-3">
                        Ask policy eligibility questions and get AI-powered rule-based answers.
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Your Query</label>
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Example: Customer has CIBIL score 680, annual income 800000, age 28. Is loan eligible?"
                            className="w-full h-28 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleQuery}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <Send size={16} />
                            {loading ? "Evaluating..." : "Evaluate Query"}
                        </button>
                        <button
                            onClick={() => {
                                setResult(null);
                                setQuery("");
                            }}
                            disabled={loading}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Clear
                        </button>
                    </div>

                    {result && (
                        <div className="border rounded-lg p-4 mt-4 bg-white animate-fade-in">
                            <div className={`mb-4 p-4 rounded-lg ${
                                result.decision === "Approved" ? "bg-green-50 border border-green-200" :
                                result.decision === "Rejected" ? "bg-red-50 border border-red-200" :
                                "bg-yellow-50 border border-yellow-200"
                            }`}>
                                <h3 className="font-bold text-lg mb-2">
                                    Decision: <span className={
                                        result.decision === "Approved" ? "text-green-700" :
                                        result.decision === "Rejected" ? "text-red-700" :
                                        "text-yellow-700"
                                    }>{result.decision}</span>
                                </h3>
                                <p className="text-gray-700">{result.reason}</p>
                            </div>

                            <div className="mb-4">
                                <h4 className="font-semibold mb-2">Applicable Rules:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {result.applicableRules?.map((rule: string, idx: number) => (
                                        <li key={idx} className="text-sm text-gray-600">{rule}</li>
                                    ))}
                                </ul>
                            </div>

                            {result.recommendations && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <h4 className="font-semibold mb-1 text-blue-900">Recommendations:</h4>
                                    <p className="text-sm text-blue-700">{result.recommendations}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
