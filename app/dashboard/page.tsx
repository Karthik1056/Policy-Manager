"use client";

import { usePolicyStats } from "@/hooks/useAnalytics";
import { Plus, Clock, CheckCircle, FileText, Download, Shield, Clipboard, Zap, Search, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardOverview() {
  const router = useRouter();
  const { data: stats, isLoading } = usePolicyStats();
  const [policies, setPolicies] = useState<any[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  useEffect(() => {
    fetch("/api/policy/getAll")
      .then((res) => res.json())
      .then((data) => {
        setPolicies(data.data || []);
        setFilteredPolicies(data.data || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = policies;

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (productFilter !== "all") {
      filtered = filtered.filter((p) => p.product === productFilter);
    }

    setFilteredPolicies(filtered);
  }, [searchTerm, statusFilter, productFilter, policies]);

  const cards = [
    { label: "Active Policies", value: stats?.published || 0, icon: <Shield className="text-green-600" size={20} />, color: "bg-green-50", change: "+2.5%" },
    { label: "Pending Approval", value: stats?.inReview || 0, icon: <Clipboard className="text-orange-600" size={20} />, color: "bg-orange-50", change: "+4 new" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policy Management</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of active and draft lending criteria rules for automated decisioning.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50">
            <Download size={16} />
            Export Report
          </button>
          <Link href="/dashboard/maker/create" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
            <Plus size={16} />
            Create New Policy
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 justify-center items-center">
        {cards.map((card) => (
          <div key={card.label} className={`p-6 rounded-xl border ${card.color} shadow-sm`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm text-gray-600">{card.label}</span>
              <div className={`p-2 bg-white rounded-lg`}>{card.icon}</div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">{isLoading ? "..." : card.value}</span>
              <span className="text-sm text-green-600 mb-1">{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18} />
            <input
              type="text"
              placeholder="Search policies by name, ID, or tag..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="px-4 py-2 border rounded-lg text-sm text-gray-900" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Status: All</option>
            <option value="PUBLISHED">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">Under Review</option>
          </select>
          <select className="px-4 py-2 border rounded-lg text-sm text-gray-900" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
            <option value="all">Product: All</option>
            {[...new Set(policies.map(p => p.product))].map(product => (
              <option key={product} value={product}>{product}</option>
            ))}
          </select>
          <button className="px-4 py-2 border rounded-lg text-sm flex items-center gap-2 text-gray-900">
            Last 30 Days
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs font-semibold text-gray-500 uppercase">
              <th className="pb-3 w-8"><input type="checkbox" /></th>
              <th className="pb-3">Policy Name / ID</th>
              <th className="pb-3">Product</th>
              <th className="pb-3">Last Modified</th>
              <th className="pb-3">Version</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : filteredPolicies.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No policies found</td></tr>
            ) : (
              filteredPolicies.map((policy) => (
                <tr key={policy.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/policy/${policy.id}`)}>
                  <td className="py-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                  <td className="py-4">
                    <div className="font-semibold text-gray-900">{policy.name}</div>
                    <div className="text-xs text-gray-500">ID: {policy.id.slice(0, 8)}</div>
                  </td>
                  <td className="py-4 text-gray-600">{policy.product || "N/A"}</td>
                  <td className="py-4">
                    <div className="text-sm text-gray-600">{new Date(policy.updatedAt).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">by {policy.maker?.name || "Unknown"}</div>
                  </td>
                  <td className="py-4 text-gray-600">{policy.version || "1.0"}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      policy.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                      policy.status === "DRAFT" ? "bg-gray-100 text-gray-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {policy.status === "PUBLISHED" ? "Active" : policy.status === "DRAFT" ? "Draft" : "Under Review"}
                    </span>
                  </td>
                  <td className="py-4" onClick={(e) => e.stopPropagation()}>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <MoreVertical size={16} className="text-gray-400" />
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
