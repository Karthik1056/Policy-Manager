"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { unwrapApiData } from "@/lib/unwrapApiData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreatePolicyPage() {
  const router = useRouter();
  const [checkers, setCheckers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    product: "",
    status: "DRAFT",
    version: "v1.0",
    description: "",
    checkerId: "",
  });

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        console.log("Checkers data:", data);
        const allUsers = data.data || [];
        const checkerUsers = allUsers.filter((u: any) => u.role === "CHECKER");
        console.log("Filtered checkers:", checkerUsers);
        setCheckers(checkerUsers);
      })
      .catch((err) => console.error("Error fetching checkers:", err));
  }, []);

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
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Policy Name</Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Input
                id="product"
                type="text"
                required
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="IN_REVIEW">IN_REVIEW</SelectItem>
                  <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                type="text"
                required
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="v1.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checker">Assign Checker (Optional)</Label>
              <Select value={formData.checkerId} onValueChange={(value) => setFormData({ ...formData, checkerId: value })}>
                <SelectTrigger id="checker">
                  <SelectValue placeholder="Select checker" />
                </SelectTrigger>
                <SelectContent>
                  {!Array.isArray(checkers) || checkers.length === 0 ? (
                    <SelectItem value="none" disabled>No checkers available</SelectItem>
                  ) : (
                    checkers.map((checker) => (
                      <SelectItem key={checker.id} value={checker.id}>
                        {checker.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Create Policy
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
