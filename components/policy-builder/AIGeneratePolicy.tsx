"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface AIGeneratePolicyProps {
    onGenerated: (structure: any) => void;
}

export default function AIGeneratePolicy({ onGenerated }: AIGeneratePolicyProps) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a description");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/policy/generate-structure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();
            
            if (!response.ok) throw new Error(data.message);

            toast.success("Policy structure generated!");
            onGenerated(data.data);
            setShowModal(false);
            setPrompt("");
        } catch (error: any) {
            toast.error(error.message || "Failed to generate structure");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
                <Sparkles size={18} />
                Generate with AI
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Generate Policy Structure with AI</h2>
                        
                        <p className="text-gray-600 mb-4">
                            Describe your policy requirements and AI will generate the structure with tabs, subtabs, and fields.
                        </p>

                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Example: Create a credit card approval policy for premium customers. Include age requirements (minimum 21), income verification (minimum 12 LPA), credit score check (minimum 750), and employment stability (6 months minimum)."
                            className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={loading}
                        />

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? "Generating..." : "Generate Structure"}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={loading}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
