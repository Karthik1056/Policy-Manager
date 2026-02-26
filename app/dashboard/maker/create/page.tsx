"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { unwrapApiData } from "@/lib/unwrapApiData";

export default function CreatePolicyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    product: "",
    status: "DRAFT",
    version: "v1.0",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Creating policy...");
    try {
      const { data } = await api.post("/policy/create", formData);
      const createdPolicy = unwrapApiData<{ id: string }>(data);
      toast.success("Policy created!", { id: loadingToast });
      router.push(`/dashboard/maker/${createdPolicy.id}/build`);
    } catch {
      toast.error("Failed to create policy", { id: loadingToast });
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Create New Policy</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Policy Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Product</label>
          <input
            type="text"
            required
            value={formData.product}
            onChange={(e) => setFormData({ ...formData, product: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-gray-900"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-gray-900"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Version</label>
          <input
            type="text"
            required
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-gray-900"
            placeholder="v1.0"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Create Policy
        </button>
      </form>
    </div>
  );
}
