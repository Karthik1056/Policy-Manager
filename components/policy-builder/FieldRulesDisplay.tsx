"use client";

import { Info, CheckCircle2, AlertCircle } from "lucide-react";
import DocumentPreview from "./DocumentPreview";

interface FieldRulesDisplayProps {
  rules: string | null;
  documentNotes?: string | null;
}

export default function FieldRulesDisplay({ rules, documentNotes }: FieldRulesDisplayProps) {
  let parsedRules: any = null;

  try {
    if (rules) {
      parsedRules = JSON.parse(rules);
    }
  } catch (e) {
    // Invalid JSON, show raw text
  }

  if (!parsedRules && !documentNotes) {
    return null;
  }

  return (
    <div className="space-y-3 mt-3">
      {/* Rules Display */}
      {parsedRules && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-900">Field Rules</h4>
          </div>
          
          <div className="space-y-2">
            {parsedRules.required && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={14} className="text-red-500" />
                <span className="text-gray-700">
                  <span className="font-medium text-red-600">Required</span> - This field must be filled
                </span>
              </div>
            )}

            {parsedRules.validations && parsedRules.validations.length > 0 && (
              <div className="space-y-1">
                {parsedRules.validations.map((validation: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={14} className="text-blue-500" />
                    <span className="text-gray-700">
                      <span className="font-medium capitalize">{validation.type}</span>: {validation.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Notes Display */}
      {documentNotes && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-start gap-2 mb-2">
            <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-gray-900">Documentation</h4>
          </div>
          <DocumentPreview content={documentNotes} />
        </div>
      )}
    </div>
  );
}
