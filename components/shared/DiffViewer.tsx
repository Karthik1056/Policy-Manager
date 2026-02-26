"use client";

import type { PolicyField } from "@/types";

interface DiffProps {
  oldData: PolicyField[];
  newData: PolicyField[];
}

export default function DiffViewer({ oldData, newData }: DiffProps) {
  // Logic to compare fields and highlight differences
  return (
    <div className="grid grid-cols-2 gap-4 h-full overflow-hidden">
      {/* Current/Old Version */}
      <div className="border rounded-lg bg-gray-50 p-4 overflow-y-auto">
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Baseline Version</h4>
        {oldData?.map((field) => (
          <div key={field.id} className="p-2 mb-2 bg-white border rounded opacity-60">
             <p className="text-xs font-bold">{field.fieldName}</p>
             <p className="text-sm font-mono">{field.operator} {field.thresholdValue}</p>
          </div>
        ))}
      </div>

      {/* New Proposed Version */}
      <div className="border rounded-lg bg-white p-4 overflow-y-auto border-blue-200">
        <h4 className="text-xs font-bold text-blue-500 uppercase mb-4">Proposed Changes</h4>
        {newData?.map((field) => {
          const isChanged = oldData?.find((o) => o.id === field.id)?.thresholdValue !== field.thresholdValue;
          return (
            <div key={field.id} className={`p-2 mb-2 border rounded ${isChanged ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-400' : 'bg-white'}`}>
               <p className="text-xs font-bold">{field.fieldName}</p>
               <p className="text-sm font-mono">{field.operator} {field.thresholdValue}</p>
               {isChanged && <span className="text-[10px] text-yellow-700 font-bold uppercase">Modified</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
