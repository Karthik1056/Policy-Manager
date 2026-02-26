"use client";

import { useState } from "react";
import { useSimulatePolicy } from "@/hooks/useSimulation";
import toast from "react-hot-toast";
import type { PolicyField } from "@/types";

interface Props {
  policyId: string;
  fields: PolicyField[]; // Pass all fields from the active policy
}

type SimulationLog = {
  ruleName: string;
  inputValue: string;
  thresholdUsed: string;
  status: "PASS" | "FAIL";
};

export default function SimulationSheet({ policyId, fields }: Props) {
  const [testData, setTestData] = useState<Record<string, string>>({});
  const { mutate: simulate, data: results, isPending } = useSimulatePolicy();

  const handleRun = () => {
    if (Object.keys(testData).length === 0) {
      return toast.error("Please enter some test values first.");
    }
    simulate({ policyId, testData });
  };

  return (
    <div className="w-[400px] h-full bg-white border-l shadow-2xl p-6 overflow-y-auto">
      <h2 className="text-xl font-bold mb-2">Policy Test Lab</h2>
      <p className="text-sm text-gray-500 mb-6">Input dummy data to test your rules.</p>

      <div className="space-y-4 mb-8">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              {field.fieldName}
            </label>
            <input
              className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={`Enter ${field.fieldType}...`}
              onChange={(e) => setTestData({ ...testData, [field.fieldName]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleRun}
        disabled={isPending}
        className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-all mb-8"
      >
        {isPending ? "Evaluating..." : "Run Simulation"}
      </button>

      {/* Results Section */}
      {results && (
        <div className="space-y-3">
          <h3 className="font-bold border-b pb-2">Execution Logs</h3>
          {(results as SimulationLog[]).map((log, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded bg-gray-50 border">
              <div>
                <p className="text-sm font-medium">{log.ruleName}</p>
                <p className="text-[10px] text-gray-500">Input: {log.inputValue} | Threshold: {log.thresholdUsed}</p>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                log.status === "PASS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {log.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
