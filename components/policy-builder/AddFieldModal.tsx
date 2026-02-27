"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Info } from "lucide-react";
import DocumentEditor from "./DocumentEditor";

interface AddFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  nextOrderIndex: number;
  editData?: any;
}

interface Rule {
  type: string;
  value: string;
}

export default function AddFieldModal({ isOpen, onClose, onSubmit, isPending, nextOrderIndex, editData }: AddFieldModalProps) {
  const [formData, setFormData] = useState({
    fieldName: "",
    fieldType: "text",
    operator: "",
    thresholdValue: "",
    weightage: 0,
    fieldValues: "",
    rules: "",
    documentNotes: "",
    orderIndex: nextOrderIndex,
  });

  const [isRequired, setIsRequired] = useState(false);
  const [dynamicRules, setDynamicRules] = useState<Rule[]>([]);
  const [policyId, setPolicyId] = useState<string>("");

  useEffect(() => {
    const id = window.location.pathname.split('/').find((_, i, arr) => arr[i - 1] === 'policy');
    if (id) setPolicyId(id);

    if (editData) {
      setFormData({
        fieldName: editData.fieldName || "",
        fieldType: editData.fieldType || "text",
        operator: editData.operator || "",
        thresholdValue: editData.thresholdValue || "",
        weightage: editData.weightage || 0,
        fieldValues: editData.fieldValues || "",
        rules: editData.rules || "",
        documentNotes: editData.documentNotes || "",
        orderIndex: editData.orderIndex || nextOrderIndex,
      });

      if (editData.rules) {
        try {
          const parsed = JSON.parse(editData.rules);
          setIsRequired(parsed.required || false);
          setDynamicRules(parsed.validations || []);
        } catch {
          setDynamicRules([]);
        }
      }
    } else {
      setFormData({
        fieldName: "",
        fieldType: "text",
        operator: "",
        thresholdValue: "",
        weightage: 0,
        fieldValues: "",
        rules: "",
        documentNotes: "",
        orderIndex: nextOrderIndex,
      });
      setIsRequired(false);
      setDynamicRules([]);
    }
  }, [editData, nextOrderIndex]);

  if (!isOpen) return null;

  const addRule = () => {
    setDynamicRules([...dynamicRules, { type: "min", value: "" }]);
  };

  const removeRule = (index: number) => {
    setDynamicRules(dynamicRules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof Rule, value: string) => {
    const updated = [...dynamicRules];
    updated[index][field] = value;
    setDynamicRules(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rulesJson = {
      required: isRequired,
      validations: dynamicRules.filter((r) => r.type && r.value),
    };

    onSubmit({
      ...formData,
      rules: JSON.stringify(rulesJson),
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full border shadow-sm animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{editData ? "Edit Field" : "Add New Field"}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Field Name *</label>
            <input
              type="text"
              required
              value={formData.fieldName}
              onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Field Type *</label>
            <select
              value={formData.fieldType}
              onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="date">Date</option>
              <option value="dropdown">Dropdown</option>
            </select>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Field Rules</h3>
            <button
              type="button"
              onClick={addRule}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Rule
            </button>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Required Field</span>
            </label>
          </div>

          <div className="space-y-3">
            {dynamicRules.map((rule, index) => (
              <div key={index} className="flex gap-2 items-center bg-white p-3 rounded-md border">
                <select
                  value={rule.type}
                  onChange={(e) => updateRule(index, "type", e.target.value)}
                  className="px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="min">Min</option>
                  <option value="max">Max</option>
                  <option value="minLength">Min Length</option>
                  <option value="maxLength">Max Length</option>
                  <option value="pattern">Pattern</option>
                  <option value="email">Email</option>
                  <option value="url">URL</option>
                </select>
                <input
                  type="text"
                  value={rule.value}
                  onChange={(e) => updateRule(index, "value", e.target.value)}
                  placeholder="Enter value"
                  className="flex-1 px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeRule(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {dynamicRules.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">No validation rules added</p>
            )}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center gap-2 mb-3">
            <Info size={18} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Document Notes</h3>
          </div>
          <DocumentEditor
            value={formData.documentNotes}
            onChange={(value) => setFormData({ ...formData, documentNotes: value })}
            policyId={policyId}
            placeholder="Add documentation notes for this field..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Operator</label>
            <input
              type="text"
              value={formData.operator}
              onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
              placeholder="e.g., >, <, ==, >="
              className="w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Threshold Value</label>
            <input
              type="text"
              value={formData.thresholdValue}
              onChange={(e) => setFormData({ ...formData, thresholdValue: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Weightage</label>
            <input
              type="number"
              value={formData.weightage}
              onChange={(e) => setFormData({ ...formData, weightage: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Order Index</label>
            <input
              type="number"
              value={formData.orderIndex}
              onChange={(e) => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Field Values</label>
          <input
            type="text"
            value={formData.fieldValues}
            onChange={(e) => setFormData({ ...formData, fieldValues: e.target.value })}
            placeholder="Comma-separated values for dropdown options"
            className="w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !formData.fieldName}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isPending ? (editData ? "Updating..." : "Adding...") : (editData ? "Update Field" : "Add Field")}
          </button>
        </div>
      </form>
    </div>
  );
}
