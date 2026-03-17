"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Search } from "lucide-react";
import api from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function VersionsPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    api.get("/policy/getAll").then(({ data }) => {
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy Name</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Current Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
            ) : filteredPolicies.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No policies found</TableCell></TableRow>
            ) : (
              filteredPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <div className="font-semibold text-gray-900">{policy.name}</div>
                    <div className="text-xs text-gray-500">ID: {policy.id.slice(0, 12)}</div>
                  </TableCell>
                  <TableCell className="text-gray-900">{policy.product || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      v{policy.version || "1.0"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      policy.status === "PUBLISHED" ? "default" :
                      policy.status === "DRAFT" ? "secondary" :
                      "outline"
                    }>
                      {policy.status === "PUBLISHED" ? "Active" : policy.status === "DRAFT" ? "Draft" : "Under Review"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {new Date(policy.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/policy/${policy.id}/versions`)}
                    >
                      <GitBranch size={14} className="mr-2" />
                      View Versions
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
