"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Search, Eye } from "lucide-react";

export default function VersionsPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/policy/getAll")
      .then((res) => res.json())
      .then((data) => {
        setPolicies(data.data || []);
        setLoading(false);
      });
  }, []);

  const filteredPolicies = policies.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policy Versions</h1>
          <p className="text-sm text-gray-500 mt-1">View and compare policy versions</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search policies by name or ID..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs font-semibold text-gray-500 uppercase">
              <th className="pb-3">Policy Name</th>
              <th className="pb-3">Product</th>
              <th className="pb-3">Current Version</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Last Modified</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : filteredPolicies.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No policies found</td></tr>
            ) : (
              filteredPolicies.map((policy) => (
                <tr key={policy.id} className="border-b hover:bg-gray-50">
                  <td className="py-4">
                    <div className="font-semibold text-gray-900">{policy.name}</div>
                    <div className="text-xs text-gray-500">ID: {policy.id.slice(0, 12)}</div>
                  </td>
                  <td className="py-4 text-gray-900">{policy.product || "N/A"}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                      v{policy.version || "1.0"}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      policy.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                      policy.status === "DRAFT" ? "bg-gray-100 text-gray-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {policy.status === "PUBLISHED" ? "Active" : policy.status === "DRAFT" ? "Draft" : "Under Review"}
                    </span>
                  </td>
                  <td className="py-4 text-gray-900">
                    {new Date(policy.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => router.push(`/dashboard/policy/${policy.id}/versions`)}
                      className="px-3 py-2 border rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-900"
                    >
                      <GitBranch size={14} />
                      View Versions
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
