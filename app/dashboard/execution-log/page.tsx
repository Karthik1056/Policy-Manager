"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, Clock, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/api";

export default function ExecutionLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    api.get("/approval/logs").then(({ data }) => {
      setLogs(data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.policyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.decision === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Execution Log</h1>
          <p className="text-sm text-gray-500 mt-1">Track all policy approval decisions and actions</p>
        </div>
        <button className="px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50">
          <Download size={16} />
          Export Logs
        </button>
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
          <select 
            className="px-4 py-2 border rounded-lg text-sm text-gray-900"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Decisions</option>
            <option value="APPROVE">Approved</option>
            <option value="REJECT">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No execution logs found</div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {log.decision === "APPROVE" ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : (
                        <XCircle size={20} className="text-red-600" />
                      )}
                      <h3 className="font-semibold text-gray-900">{log.policyName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.decision === "APPROVE" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {log.decision}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Reviewer: {log.checkerName || "Unknown"}</p>
                      {log.notes && <p className="italic">Notes: {log.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
