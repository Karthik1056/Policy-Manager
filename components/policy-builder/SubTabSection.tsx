"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import type { SubTab } from "@/types";
import { unwrapApiData } from "@/lib/unwrapApiData";
import SubTabFormDrawer from "./SubTabFormDrawer";
import FieldFormDrawer from "./FieldFormDrawer";
import FieldRulesDisplay from "./FieldRulesDisplay";
import DocumentPreview from "./DocumentPreview";
import { Plus, Trash2, Edit2, Briefcase, LayoutList, Table as TableIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LogicOperator = "AND" | "OR" | "XOR";

type OutcomeConfig = {
  thenAction: string;
  elseAction: string;
  thenCustom: string;
  elseCustom: string;
};

const DEFAULT_OUTCOME: OutcomeConfig = {
  thenAction: "APPROVE",
  elseAction: "MANUAL_REVIEW",
  thenCustom: "",
  elseCustom: "",
};

function compareValue(field: any, rawInput: string): boolean {
  const operator = field?.operator || "==";
  const threshold = field?.thresholdValue ?? field?.fieldValues ?? "";

  const inputNumber = Number(rawInput);
  const thresholdNumber = Number(threshold);
  const bothNumbers = Number.isFinite(inputNumber) && Number.isFinite(thresholdNumber) && rawInput !== "";

  if (bothNumbers) {
    if (operator === ">=") return inputNumber >= thresholdNumber;
    if (operator === "<=") return inputNumber <= thresholdNumber;
    if (operator === ">") return inputNumber > thresholdNumber;
    if (operator === "<") return inputNumber < thresholdNumber;
    if (operator === "!=") return inputNumber !== thresholdNumber;
    return inputNumber === thresholdNumber;
  }

  const input = String(rawInput || "").trim().toLowerCase();
  const target = String(threshold || "").trim().toLowerCase();

  if (operator === "!=") return input !== target;
  return input === target;
}

function evaluateChain(results: boolean[], operators: LogicOperator[]): boolean {
  if (results.length === 0) return false;
  let finalResult = results[0];

  for (let i = 1; i < results.length; i += 1) {
    const op = operators[i - 1] || "AND";
    if (op === "AND") finalResult = finalResult && results[i];
    if (op === "OR") finalResult = finalResult || results[i];
    if (op === "XOR") finalResult = Boolean(finalResult) !== Boolean(results[i]);
  }

  return finalResult;
}

export default function SubTabSection({ tabId }: { tabId: string }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [selectedSubTabId, setSelectedSubTabId] = useState<string | null>(null);
  const [editingSubTab, setEditingSubTab] = useState<SubTab | null>(null);
  const [editingField, setEditingField] = useState<any>(null);
  const [deleteSubTabId, setDeleteSubTabId] = useState<string | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);

  const [fieldLogic, setFieldLogic] = useState<Record<string, LogicOperator>>({});
  const [subTabLogic, setSubTabLogic] = useState<Record<string, LogicOperator>>({});

  const [advancedOpen, setAdvancedOpen] = useState<Record<string, boolean>>({});
  const [outcomes, setOutcomes] = useState<Record<string, OutcomeConfig>>({});
  const [testInputs, setTestInputs] = useState<Record<string, Record<string, string>>>({});
  const [testResults, setTestResults] = useState<Record<string, { matched: boolean; decision: string; details: string }>>({});

  const { data: subTabs, isLoading } = useQuery({
    queryKey: ["subTabs", tabId],
    queryFn: async () => {
      const { data } = await api.get(`/subtab?tabId=${tabId}`);
      return unwrapApiData<SubTab[]>(data);
    },
    enabled: !!tabId,
  });

  const { mutate: createSubTab, isPending } = useMutation({
    mutationFn: (newSubTab: { name: string; orderIndex: number; tabId: string; documentNotes?: string }) =>
      api.post("/subtab/create", newSubTab),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subTabs", tabId] });
      toast.success("Rule group created!");
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create rule group";
      toast.error(message);
    },
  });

  const { mutate: updateSubTab } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/subtab/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subTabs", tabId] });
      toast.success("Rule group updated!");
      setEditingSubTab(null);
      setIsModalOpen(false);
    },
  });

  const { mutate: deleteSubTab } = useMutation({
    mutationFn: (id: string) => api.delete(`/subtab/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subTabs", tabId] });
      toast.success("Rule group deleted!");
    },
  });

  const { mutate: createField, isPending: isFieldPending } = useMutation({
    mutationFn: (newField: any) => api.post("/field/create", newField),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subTabs", tabId] });
      toast.success("Rule created!");
      setIsFieldModalOpen(false);
      setSelectedSubTabId(null);
    },
  });

  const { mutate: updateField } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/field/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subTabs", tabId] });
      toast.success("Rule updated!");
      setEditingField(null);
      setIsFieldModalOpen(false);
    },
  });

  const { mutate: deleteField } = useMutation({
    mutationFn: (id: string) => api.delete(`/field/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subTabs", tabId] });
      toast.success("Rule deleted!");
    },
  });

  const handleAddSubTab = (data: { name: string; orderIndex: number; documentNotes?: string }) => {
    const safeOrderIndex = Number.isFinite(data.orderIndex) ? data.orderIndex : (subTabs?.length || 0);
    if (editingSubTab) {
      updateSubTab({ id: editingSubTab.id, data: { ...data, orderIndex: safeOrderIndex } });
    } else {
      createSubTab({ ...data, orderIndex: safeOrderIndex, tabId });
    }
  };

  const handleAddField = (data: any) => {
    if (editingField) {
      updateField({ id: editingField.id, data });
    } else if (selectedSubTabId) {
      createField({ ...data, subTabId: selectedSubTabId });
    }
  };

  const handleFieldLogicChange = (key: string, value: LogicOperator) => {
    setFieldLogic((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubTabLogicChange = (key: string, value: LogicOperator) => {
    setSubTabLogic((prev) => ({ ...prev, [key]: value }));
  };

  const getOutcome = (subTabId: string): OutcomeConfig => outcomes[subTabId] || DEFAULT_OUTCOME;

  const updateOutcome = (subTabId: string, patch: Partial<OutcomeConfig>) => {
    setOutcomes((prev) => ({
      ...prev,
      [subTabId]: { ...(prev[subTabId] || DEFAULT_OUTCOME), ...patch },
    }));
  };

  const updateTestInput = (subTabId: string, fieldId: string, value: string) => {
    setTestInputs((prev) => ({
      ...prev,
      [subTabId]: {
        ...(prev[subTabId] || {}),
        [fieldId]: value,
      },
    }));
  };

  const runRuleTest = (subTab: any) => {
    const fields = subTab?.fields || [];
    if (!fields.length) {
      toast.error("Add at least one field to test this rule group");
      return;
    }

    const inputByField = testInputs[subTab.id] || {};
    const checks = fields.map((field: any) => compareValue(field, inputByField[field.id] || ""));
    const operators: LogicOperator[] = fields.slice(0, -1).map((_: any, idx: number) => {
      const key = `${subTab.id}-field-${idx}`;
      return fieldLogic[key] || "AND";
    });

    const matched = evaluateChain(checks, operators);
    const outcome = getOutcome(subTab.id);

    const thenDecision = outcome.thenAction === "CUSTOM" ? (outcome.thenCustom || "CUSTOM") : outcome.thenAction;
    const elseDecision = outcome.elseAction === "CUSTOM" ? (outcome.elseCustom || "CUSTOM") : outcome.elseAction;

    setTestResults((prev) => ({
      ...prev,
      [subTab.id]: {
        matched,
        decision: matched ? thenDecision : elseDecision,
        details: matched
          ? "Input satisfies IF conditions"
          : "Input does not satisfy IF conditions",
      },
    }));
  };

  if (isLoading) return <div className="text-center py-10 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eligibility Criteria</h1>
          <p className="text-xs text-gray-500 mt-1">Define mandatory gatekeeper conditions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-2"
        >
          <Plus size={14} />
          Add Group
        </button>
      </div>

      {subTabs?.map((subTab: any, subTabIndex: number) => {
        const subTabLogicKey = `subtab-${subTabIndex}`;
        const currentSubTabLogic = subTabLogic[subTabLogicKey] || "AND";
        const subOutcome = getOutcome(subTab.id);
        const subResult = testResults[subTab.id];

        return (
          <div key={subTab.id}>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-600" />
                  <h3 className="font-bold text-blue-600 uppercase text-xs">{subTab.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      const newMode = subTab.displayMode === "table" ? "document" : "table";
                      updateSubTab({ id: subTab.id, data: { displayMode: newMode } });
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      subTab.displayMode === "table"
                        ? "bg-blue-600 text-white"
                        : "hover:bg-white text-gray-500"
                    }`}
                    title={subTab.displayMode === "table" ? "Switch to List View" : "Switch to Table View"}
                  >
                    {subTab.displayMode === "table" ? <LayoutList size={14} /> : <TableIcon size={14} />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingSubTab(subTab);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 hover:bg-white rounded text-blue-600"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteSubTabId(subTab.id)}
                    className="p-1.5 hover:bg-white rounded text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {subTab.documentNotes && (
                <DocumentPreview content={subTab.documentNotes} className="bg-blue-50 border-blue-200" />
              )}

              {subTab.displayMode === "table" ? (
                <div className="bg-white rounded-md border shadow-sm overflow-hidden ml-11">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-3 py-2 font-bold text-gray-700 w-8">#</th>
                        <th className="px-3 py-2 font-bold text-gray-700">Attribute</th>
                        <th className="px-3 py-2 font-bold text-gray-700">Operator</th>
                        <th className="px-3 py-2 font-bold text-gray-700">Value</th>
                        <th className="px-3 py-2 font-bold text-gray-700">Rules/Notes</th>
                        <th className="px-3 py-2 font-bold text-gray-700 w-16 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {subTab.fields?.map((field: any, fieldIndex: number) => (
                        <tr key={field.id} className="hover:bg-gray-50 group">
                          <td className="px-3 py-2 text-gray-500 font-medium">{fieldIndex + 1}</td>
                          <td className="px-3 py-2 font-semibold text-gray-900">{field.fieldName}</td>
                          <td className="px-3 py-2 text-gray-700">{field.operator || "N/A"}</td>
                          <td className="px-3 py-2 text-blue-700 font-medium">
                            {field.thresholdValue || field.fieldValues || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            <div className="max-w-[150px] truncate text-gray-500" title={field.documentNotes || ""}>
                              {field.documentNotes || "-"}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingField(field);
                                  setSelectedSubTabId(subTab.id);
                                  setIsFieldModalOpen(true);
                                }}
                                className="p-1 hover:bg-blue-50 rounded text-blue-500"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => setDeleteFieldId(field.id)}
                                className="p-1 hover:bg-red-50 rounded text-red-500"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(subTab.fields?.length || 0) === 0 && (
                    <div className="p-4 text-center text-gray-400 italic">No rules in this table yet.</div>
                  )}
                </div>
              ) : (
                subTab.fields?.map((field: any, fieldIndex: number) => {
                  const fieldLogicKey = `${subTab.id}-field-${fieldIndex}`;
                  const currentFieldLogic = fieldLogic[fieldLogicKey] || "AND";

                  return (
                    <div key={field.id}>
                      <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-sm text-gray-700 border-2 border-gray-200 flex-shrink-0">
                          {fieldIndex + 1}
                        </div>

                        <div className="flex-1 bg-white rounded-md p-3 shadow-sm border">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase">{field.fieldName}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingField(field);
                                  setSelectedSubTabId(subTab.id);
                                  setIsFieldModalOpen(true);
                                }}
                                className="p-1 hover:bg-blue-50 rounded text-blue-500"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => setDeleteFieldId(field.id)}
                                className="p-1 hover:bg-red-50 rounded text-red-500"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Attribute</label>
                              <div className="px-2 py-1.5 bg-gray-50 border rounded text-xs text-gray-900">
                                {field.fieldName}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Operator</label>
                              <div className="px-2 py-1.5 bg-gray-50 border rounded text-xs text-gray-900">
                                {field.operator || "N/A"}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
                              <div className="px-2 py-1.5 bg-gray-50 border rounded text-xs text-gray-900">
                                {field.thresholdValue || field.fieldValues || "N/A"}
                              </div>
                            </div>
                          </div>

                          <FieldRulesDisplay
                            rules={field.rules ?? null}
                            documentNotes={field.documentNotes ?? null}
                          />
                        </div>
                      </div>

                      {fieldIndex < (subTab.fields?.length || 0) - 1 && (
                        <div className="flex items-center gap-2 py-2 ml-11">
                          <label className="text-xs text-gray-500 font-semibold">Logic</label>
                          <select
                            value={currentFieldLogic}
                            onChange={(e) => handleFieldLogicChange(fieldLogicKey, e.target.value as LogicOperator)}
                            className="px-2 py-1 border rounded text-xs bg-white text-gray-800"
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                            <option value="XOR">XOR</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <div className="ml-11">
                <button
                  onClick={() => {
                    setSelectedSubTabId(subTab.id);
                    setEditingField(null);
                    setIsFieldModalOpen(true);
                  }}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-white text-xs flex items-center justify-center gap-1"
                >
                  <Plus size={14} />
                  Add Rule
                </button>
              </div>

              <div className="bg-white border rounded-lg p-4 mt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900">Advanced Rule Builder (IF-THEN-ELSE)</h4>
                  <button
                    onClick={() => setAdvancedOpen((prev) => ({ ...prev, [subTab.id]: !prev[subTab.id] }))}
                    className="text-xs px-3 py-1 border rounded hover:bg-gray-50"
                  >
                    {advancedOpen[subTab.id] ? "Close" : "Open"}
                  </button>
                </div>

                {advancedOpen[subTab.id] && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
                      <p className="text-xs font-bold text-blue-700 mb-2">IF (Conditions)</p>
                      <div className="space-y-2">
                        {(subTab.fields || []).map((field: any, idx: number) => (
                          <div key={`${subTab.id}-if-${field.id}`} className="text-xs text-gray-700">
                            <span className="font-semibold">{field.fieldName}</span>
                            <span className="mx-1">{field.operator || "=="}</span>
                            <span className="text-blue-700">{field.thresholdValue || field.fieldValues || "N/A"}</span>
                            {idx < (subTab.fields?.length || 0) - 1 && (
                              <span className="ml-2 inline-flex items-center gap-1">
                                <span className="text-gray-500">next with</span>
                                <select
                                  value={fieldLogic[`${subTab.id}-field-${idx}`] || "AND"}
                                  onChange={(e) => handleFieldLogicChange(`${subTab.id}-field-${idx}`, e.target.value as LogicOperator)}
                                  className="px-2 py-0.5 border rounded text-xs bg-white"
                                >
                                  <option value="AND">AND</option>
                                  <option value="OR">OR</option>
                                  <option value="XOR">XOR</option>
                                </select>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">THEN Action</label>
                        <select
                          value={subOutcome.thenAction}
                          onChange={(e) => updateOutcome(subTab.id, { thenAction: e.target.value })}
                          className="w-full px-2 py-2 border rounded text-sm"
                        >
                          <option value="APPROVE">APPROVE</option>
                          <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
                          <option value="REJECT">REJECT</option>
                          <option value="CUSTOM">CUSTOM</option>
                        </select>
                        {subOutcome.thenAction === "CUSTOM" && (
                          <input
                            value={subOutcome.thenCustom}
                            onChange={(e) => updateOutcome(subTab.id, { thenCustom: e.target.value })}
                            placeholder="Enter custom THEN action"
                            className="w-full mt-2 px-2 py-2 border rounded text-sm"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">ELSE Action</label>
                        <select
                          value={subOutcome.elseAction}
                          onChange={(e) => updateOutcome(subTab.id, { elseAction: e.target.value })}
                          className="w-full px-2 py-2 border rounded text-sm"
                        >
                          <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
                          <option value="APPROVE">APPROVE</option>
                          <option value="REJECT">REJECT</option>
                          <option value="CUSTOM">CUSTOM</option>
                        </select>
                        {subOutcome.elseAction === "CUSTOM" && (
                          <input
                            value={subOutcome.elseCustom}
                            onChange={(e) => updateOutcome(subTab.id, { elseCustom: e.target.value })}
                            placeholder="Enter custom ELSE action"
                            className="w-full mt-2 px-2 py-2 border rounded text-sm"
                          />
                        )}
                      </div>
                    </div>

                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-bold text-gray-700 mb-2">Rule Testing Interface</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(subTab.fields || []).map((field: any) => (
                          <div key={`${subTab.id}-test-${field.id}`}>
                            <label className="block text-xs text-gray-600 mb-1">{field.fieldName}</label>
                            <input
                              value={testInputs[subTab.id]?.[field.id] || ""}
                              onChange={(e) => updateTestInput(subTab.id, field.id, e.target.value)}
                              className="w-full px-2 py-1.5 border rounded text-xs bg-white"
                              placeholder="Enter sample value"
                            />
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => runRuleTest(subTab)}
                        className="mt-3 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Test Rule
                      </button>

                      {subResult && (
                        <div className={`mt-3 p-3 rounded border text-xs ${subResult.matched ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
                          <p className="font-semibold">Decision: {subResult.decision}</p>
                          <p className="text-gray-600 mt-1">{subResult.details}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {subTabIndex < (subTabs?.length || 0) - 1 && (
              <div className="flex items-center gap-2 py-3">
                <label className="text-xs text-gray-500 font-semibold">Group Logic</label>
                <select
                  value={currentSubTabLogic}
                  onChange={(e) => handleSubTabLogicChange(subTabLogicKey, e.target.value as LogicOperator)}
                  className="px-2 py-1 border rounded text-xs bg-white text-gray-800"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                  <option value="XOR">XOR</option>
                </select>
              </div>
            )}
          </div>
        );
      })}

      {subTabs?.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-gray-50">
          <p className="text-gray-400 text-sm">No rule groups. Click "Add Group" to start.</p>
        </div>
      )}

      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus size={16} />
        Add Rule Group
      </button>

      <SubTabFormDrawer
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingSubTab(null);
        }}
        onSubmit={handleAddSubTab}
        isPending={isPending}
        nextOrderIndex={(subTabs?.length || 0) + 1}
        editData={
          editingSubTab
            ? {
                name: editingSubTab.name,
                orderIndex: editingSubTab.orderIndex,
                documentNotes: editingSubTab.documentNotes ?? undefined,
              }
            : null
        }
        policyId={tabId}
      />

      <FieldFormDrawer
        open={isFieldModalOpen}
        onOpenChange={(open) => {
          setIsFieldModalOpen(open);
          if (!open) {
            setSelectedSubTabId(null);
            setEditingField(null);
          }
        }}
        onSubmit={handleAddField}
        isPending={isFieldPending}
        nextOrderIndex={
          (subTabs?.find((st) => st.id === selectedSubTabId)?.fields?.length || 0) + 1
        }
        editData={editingField}
      />

      <AlertDialog open={!!deleteSubTabId} onOpenChange={(open) => !open && setDeleteSubTabId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule group? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteSubTabId) deleteSubTab(deleteSubTabId);
              setDeleteSubTabId(null);
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteFieldId} onOpenChange={(open) => !open && setDeleteFieldId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteFieldId) deleteField(deleteFieldId);
              setDeleteFieldId(null);
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
