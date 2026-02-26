"use client";

import { useAuditLogs } from "@/hooks/useAudit";
import { format } from "date-fns";
import { User, Clock, FileEdit, CheckCircle2, XCircle } from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  createdAt: string | Date;
};

export default function AuditTimeline({ policyId }: { policyId: string }) {
  const { data: logs, isLoading } = useAuditLogs(policyId);

  const getIcon = (action: string) => {
    switch (action) {
      case "CREATED": return <FileEdit size={14} className="text-blue-500" />;
      case "SUBMITTED": return <Clock size={14} className="text-orange-500" />;
      case "APPROVED": return <CheckCircle2 size={14} className="text-green-500" />;
      case "REJECTED": return <XCircle size={14} className="text-red-500" />;
      default: return <User size={14} className="text-gray-500" />;
    }
  };

  if (isLoading) return <div className="p-4 text-xs text-gray-400">Loading history...</div>;

  return (
    <div className="flow-root p-6 bg-white border rounded-xl shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Activity History</h3>
      <ul className="-mb-8">
        {(logs as AuditLog[] | undefined)?.map((log, idx) => (
          <li key={log.id}>
            <div className="relative pb-8">
              {idx !== ((logs as AuditLog[] | undefined)?.length ?? 0) - 1 && (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-gray-50 border flex items-center justify-center ring-8 ring-white">
                    {getIcon(log.action)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-800 font-medium">
                      {log.action} <span className="font-normal text-gray-500">by</span> {log.performedBy}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{log.details}</p>
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-gray-400">
                    {format(new Date(log.createdAt), "MMM d, HH:mm")}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
