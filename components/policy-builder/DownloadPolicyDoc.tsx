"use client";

import { FileDown } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface DownloadPolicyDocProps {
    policyId: string;
    policyName?: string;
}

export default function DownloadPolicyDoc({ policyId, policyName }: DownloadPolicyDocProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/policy/${policyId}/document`, { responseType: "blob" });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${policyName || "policy"}-${new Date().toISOString().split('T')[0]}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Document downloaded successfully");
        } catch (error) {
            toast.error("Failed to download document");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            <FileDown size={18} />
            {loading ? "Generating..." : "Download DOCX"}
        </button>
    );
}
