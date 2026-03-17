"use client";

import { useState, useEffect } from "react";
import { Search, Download, ChevronDown, ChevronUp, Edit, Trash2, Plus, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function AuditLogPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/policy/getAll").then(r => r.data),
      api.get("/policy/audit").then(r => r.data)
    ])
      .then(([policiesData, logsData]) => {
        const policiesList = policiesData.data || [];
        const logsList = logsData.data || [];
        
        const policiesWithLogs = policiesList.map((policy: any) => ({
          ...policy,
          auditLogs: logsList.filter((log: any) => log.policyId === policy.id)
        }));
        
        setPolicies(policiesWithLogs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredPolicies = policies.filter((policy) =>
    policy.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATED": return <Plus size={14} className="text-green-600" />;
      case "UPDATED": return <Edit size={14} className="text-blue-600" />;
      case "DELETED": return <Trash2 size={14} className="text-red-600" />;
      default: return <FileText size={14} className="text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATED": return "bg-green-100 text-green-700";
      case "UPDATED": return "bg-blue-100 text-blue-700";
      case "DELETED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">Track all policy changes and modifications</p>
        </div>
        <Button variant="outline">
          <Download size={16} className="mr-2" />
          Export Audit Log
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by policy name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredPolicies.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No policies found</div>
        ) : (
          <div className="space-y-3">
            {filteredPolicies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{policy.name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <span>Version: {policy.version}</span>
                        <span>•</span>
                        <span>{policy.auditLogs?.length || 0} audit logs</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      {expandedPolicy === policy.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </Button>
                  </div>
                </CardHeader>

                {expandedPolicy === policy.id && (
                  <CardContent className="border-t bg-gray-50 pt-4">
                    {policy.auditLogs?.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No audit logs for this policy</p>
                    ) : (
                      <div className="space-y-2">
                        {policy.auditLogs.map((log: any) => (
                          <Card key={log.id}>
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  {getActionIcon(log.action)}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant={
                                        log.action === "CREATED" ? "default" :
                                        log.action === "UPDATED" ? "outline" :
                                        log.action === "DELETED" ? "destructive" :
                                        "secondary"
                                      }>
                                        {log.action}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        by {log.userName || "Unknown"}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{log.changes || "No details"}</p>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(log.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
