"use client";

import { FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface GenerateAIDocProps {
    policyId: string;
    policyName?: string;
}

export default function GenerateAIDoc({ policyId, policyName }: GenerateAIDocProps) {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await api.post(`/policy/${policyId}/ai-document`, {}, { responseType: "blob" });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${policyName || "policy"}-AI-${new Date().toISOString().split('T')[0]}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("AI document generated successfully");
        } catch (error) {
            toast.error("Failed to generate AI document");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
            <Sparkles size={18} />
            {loading ? "Generating Document..." : "Generate Document"}
        </button>
    );
}
