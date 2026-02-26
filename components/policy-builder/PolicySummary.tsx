"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { unwrapApiData } from "@/lib/unwrapApiData";
import { FileText } from "lucide-react";

interface PolicySummaryProps {
  tabId: string;
}

export default function PolicySummary({ tabId }: PolicySummaryProps) {
  const { data: subTabs } = useQuery({
    queryKey: ["subTabs", tabId],
    queryFn: async () => {
      const { data } = await api.get(`/subtab?tabId=${tabId}`);
      return unwrapApiData<any[]>(data);
    },
    enabled: !!tabId,
  });

  const totalRules = subTabs?.reduce((acc, st) => acc + (st.fields?.length || 0), 0) || 0;
  const approvalRate = totalRules > 0 ? Math.min(95, 60 + totalRules * 5) : 0;

  return (
    <div className="w-80 bg-white border-l p-5 overflow-y-auto space-y-5 flex items-center flex-col justify-center">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText size={18} className="text-blue-600" />
          <h3 className="font-bold text-gray-900 text-sm">Policy Summary</h3>
        </div>
        <p className="text-xs text-gray-500">
          This policy will automatically approve applicants who meet the following criteria logic:
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs space-y-2">
        {subTabs?.map((subTab, subTabIdx) => (
          <div key={subTab.id}>
            {subTab.fields?.map((field: any, fieldIdx: number) => (
              <div key={field.id} className="leading-relaxed">
                {fieldIdx === 0 && subTabIdx === 0 && (
                  <span className="text-blue-600 font-bold">IF </span>
                )}
                <span className="text-gray-900">{field.fieldName}</span>
                {" "}
                <span className="text-purple-600">{field.operator || "=="}</span>
                {" "}
                <span className="text-blue-600 font-semibold">{field.thresholdValue || "value"}</span>
                
                {fieldIdx < (subTab.fields?.length || 0) - 1 && (
                  <div className="ml-4">
                    <span className="text-blue-600 font-bold">AND </span>
                  </div>
                )}
              </div>
            ))}
            
            {subTabIdx < (subTabs?.length || 0) - 1 && (
              <div className="my-2">
                <span className="text-orange-600 font-bold">OR </span>
              </div>
            )}
          </div>
        ))}
        
        {(!subTabs || subTabs.length === 0) && (
          <div className="text-gray-400 italic">No rules defined</div>
        )}
      </div>

      {totalRules > 0 && (
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-600">Est. Approval Rate</span>
              <span className="text-sm font-bold text-green-600">{approvalRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${approvalRate}%` }}
              ></div>
            </div>
          </div>

          
        </div>
      )}
    </div>
  );
}
