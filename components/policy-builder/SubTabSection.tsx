"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import type { SubTab } from "@/types";
import { unwrapApiData } from "@/lib/unwrapApiData";
import AddSubTabModal from "./AddSubTabModal";
import AddFieldModal from "./AddFieldModal";
import FieldRulesDisplay from "./FieldRulesDisplay";
import DocumentPreview from "./DocumentPreview";
import { Plus, Trash2, Edit2, Briefcase } from "lucide-react";

export default function SubTabSection({ tabId }: { tabId: string }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [selectedSubTabId, setSelectedSubTabId] = useState<string | null>(null);
  const [editingSubTab, setEditingSubTab] = useState<SubTab | null>(null);
  const [editingField, setEditingField] = useState<any>(null);
  const [fieldLogic, setFieldLogic] = useState<Record<string, "AND" | "OR">>({});
  const [subTabLogic, setSubTabLogic] = useState<Record<string, "AND" | "OR">>({});

  const { data: subTabs, isLoading } = useQuery({
    queryKey: ["subTabs", tabId],
    queryFn: async () => {
      const { data } = await api.get(`/subtab?tabId=${tabId}`);
      return unwrapApiData<SubTab[]>(data);
    },
    enabled: !!tabId,
  });

  const { mutate: createSubTab, isPending } = useMutation({
    mutationFn: (newSubTab: { name: string; orderIndex: number; tabId: string }) =>
      api.post("/subtab/create", newSubTab),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subTabs", tabId] });
      toast.success("Rule group created!");
      setIsModalOpen(false);
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

  const handleAddSubTab = (data: { name: string; orderIndex: number }) => {
    if (editingSubTab) {
      updateSubTab({ id: editingSubTab.id, data });
    } else {
      createSubTab({ ...data, tabId });
    }
  };

  const handleAddField = (data: any) => {
    if (editingField) {
      updateField({ id: editingField.id, data });
    } else if (selectedSubTabId) {
      createField({ ...data, subTabId: selectedSubTabId });
    }
  };

  const toggleFieldLogic = (key: string) => {
    setFieldLogic((prev) => ({
      ...prev,
      [key]: prev[key] === "OR" ? "AND" : "OR",
    }));
  };

  const toggleSubTabLogic = (key: string) => {
    setSubTabLogic((prev) => ({
      ...prev,
      [key]: prev[key] === "OR" ? "AND" : "OR",
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

      {subTabs?.map((subTab, subTabIndex) => {
        const subTabLogicKey = `subtab-${subTabIndex}`;
        const currentSubTabLogic = subTabLogic[subTabLogicKey] || "AND";

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
                      setEditingSubTab(subTab);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 hover:bg-white rounded text-blue-600"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${subTab.name}"?`)) deleteSubTab(subTab.id);
                    }}
                    className="p-1.5 hover:bg-white rounded text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {subTab.documentNotes && (
                <DocumentPreview content={subTab.documentNotes} className="bg-blue-50 border-blue-200" />
              )}

              {subTab.fields?.map((field, fieldIndex) => {
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
                              onClick={() => {
                                if (confirm(`Delete "${field.fieldName}"?`)) deleteField(field.id);
                              }}
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
                              {field.thresholdValue || "N/A"}
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
                        <button
                          onClick={() => toggleFieldLogic(fieldLogicKey)}
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            currentFieldLogic === "AND"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          AND
                        </button>
                        <button
                          onClick={() => toggleFieldLogic(fieldLogicKey)}
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            currentFieldLogic === "OR"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          OR
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

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
            </div>

            {subTabIndex < (subTabs?.length || 0) - 1 && (
              <div className="flex items-center gap-2 py-3">
                <button
                  onClick={() => toggleSubTabLogic(subTabLogicKey)}
                  className={`px-3 py-1 rounded text-xs font-bold ${
                    currentSubTabLogic === "AND"
                      ? "bg-gray-700 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  AND
                </button>
                <button
                  onClick={() => toggleSubTabLogic(subTabLogicKey)}
                  className={`px-3 py-1 rounded text-xs font-bold ${
                    currentSubTabLogic === "OR"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  OR
                </button>
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

      <AddSubTabModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSubTab(null);
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

      <AddFieldModal
        isOpen={isFieldModalOpen}
        onClose={() => {
          setIsFieldModalOpen(false);
          setSelectedSubTabId(null);
          setEditingField(null);
        }}
        onSubmit={handleAddField}
        isPending={isFieldPending}
        nextOrderIndex={
          (subTabs?.find((st) => st.id === selectedSubTabId)?.fields?.length || 0) + 1
        }
        editData={editingField}
      />
    </div>
  );
}
