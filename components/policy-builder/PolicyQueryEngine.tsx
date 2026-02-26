"use client";

import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface PolicyQueryEngineProps {
    policyId: string;
}

export default function PolicyQueryEngine({ policyId }: PolicyQueryEngineProps) {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    const handleQuery = async () => {
        if (!query.trim()) {
            toast.error("Please enter a query");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/policy/${policyId}/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            });

            const data = await response.json();
            
            if (!response.ok) throw new Error(data.message);

            setResult(data.data);
            toast.success("Query evaluated!");
        } catch (error: any) {
            toast.error(error.message || "Failed to evaluate query");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
            >
                <MessageSquare size={18} />
                Query Policy
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Policy Query Engine</h2>
                        
                        <p className="text-gray-600 mb-4">
                            Ask questions about policy eligibility and get AI-powered answers based on policy rules.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Your Query</label>
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Example: Customer has CIBIL score of 680 and annual income of 800000. Age is 28. Is loan eligible?"
                                className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                                disabled={loading}
                            />
                        </div>

                        <button
                            onClick={handleQuery}
                            disabled={loading}
                            className="w-full mb-4 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <Send size={18} />
                            {loading ? "Evaluating..." : "Evaluate Query"}
                        </button>

                        {result && (
                            <div className="border rounded-lg p-4 mb-4">
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

                        <button
                            onClick={() => {
                                setShowModal(false);
                                setResult(null);
                                setQuery("");
                            }}
                            disabled={loading}
                            className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
