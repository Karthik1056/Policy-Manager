"use client";

import { usePolicyStats } from "@/hooks/useAnalytics";
import { Plus, Download, Shield, Clipboard, Search, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import api from "@/lib/api";

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
    api.get("/policy/getAll").then(({ data }) => {
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
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Export Report
          </Button>
          <Button asChild>
            <Link href="/dashboard/maker/create">
              <Plus size={16} className="mr-2" />
              Create New Policy
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 justify-center items-center">
        {cards.map((card) => (
          <Card key={card.label} className={card.color}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm text-gray-600">{card.label}</span>
                <div className="p-2 bg-white rounded-lg">{card.icon}</div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">{isLoading ? "..." : card.value}</span>
                <span className="text-sm text-green-600 mb-1">{card.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search policies by name, ID, or tag..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status: All</SelectItem>
              <SelectItem value="PUBLISHED">Active</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="IN_REVIEW">Under Review</SelectItem>
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Product: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Product: All</SelectItem>
              {[...new Set(policies.map(p => p.product))].map(product => (
                <SelectItem key={product} value={product}>{product}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">Last 30 Days</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"><Checkbox /></TableHead>
              <TableHead>Policy Name / ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
            ) : filteredPolicies.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No policies found</TableCell></TableRow>
            ) : (
              filteredPolicies.map((policy) => (
                <TableRow key={policy.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/policy/${policy.id}`)}>
                  <TableCell onClick={(e) => e.stopPropagation()}><Checkbox /></TableCell>
                  <TableCell>
                    <div className="font-semibold text-gray-900">{policy.name}</div>
                    <div className="text-xs text-gray-500">ID: {policy.id.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell className="text-gray-600">{policy.product || "N/A"}</TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">{new Date(policy.updatedAt).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">by {policy.maker?.name || "Unknown"}</div>
                  </TableCell>
                  <TableCell className="text-gray-600">{policy.version || "1.0"}</TableCell>
                  <TableCell>
                    <Badge variant={
                      policy.status === "PUBLISHED" ? "default" :
                      policy.status === "DRAFT" ? "secondary" :
                      "outline"
                    }>
                      {policy.status === "PUBLISHED" ? "Active" : policy.status === "DRAFT" ? "Draft" : "Under Review"}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/policy/${policy.id}`)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/maker/${policy.id}`)}>Edit</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
