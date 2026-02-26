"use client";

import { useUpdateField } from "@/hooks/useHierarchy";
import { useState } from "react";
import type { PolicyField } from "@/types";
import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function RuleCard({ field }: { field: PolicyField }) {
    const { mutate: updateField } = useUpdateField();
    const [val, setVal] = useState(field.thresholdValue ?? "");
    const queryClient = useQueryClient();

    const { mutate: deleteField } = useMutation({
        mutationFn: (id: string) => api.delete(`/field/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subTabs"] });
            toast.success("Field deleted!");
        },
    });

    const handleBlur = () => {
        if (val !== field.thresholdValue) {
            updateField({ id: field.id, thresholdValue: val });
        }
    };

    return (
        <div className="p-4 border rounded-md bg-white hover:border-blue-300 transition-all relative group">
            <button
                onClick={() => {
                    if (confirm(`Delete field "${field.fieldName}"?`)) deleteField(field.id);
                }}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600"
            >
                <Trash2 size={14} />
            </button>
            <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-700">{field.fieldName}</span>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase font-bold">
                    {field.fieldType}
                </span>
            </div>

            <div className="flex gap-4 items-center">
                <select
                    defaultValue={field.operator ?? ""}
                    className="border rounded p-1 text-sm bg-gray-50 text-gray-900"
                    onChange={(e) => updateField({ id: field.id, operator: e.target.value })}
                >
                    <option value="" disabled>
                      Operator
                    </option>
                    <option value=">=">Greater or Equal ( {">="} )</option>
                    <option value="<">Less Than ( {"<"} )</option>
                    <option value="==">Equals ( == )</option>
                </select>

                <input
                    type="text"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    onBlur={handleBlur}
                    className="border rounded p-1 text-sm flex-1 outline-none focus:ring-1 focus:ring-blue-400 text-gray-900"
                    placeholder="Value..."
                />
            </div>
        </div>
    );
}  
