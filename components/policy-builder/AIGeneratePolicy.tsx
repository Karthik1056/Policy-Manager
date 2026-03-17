"use client";

import { ChevronDown, ChevronRight, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

type AIField = {
    fieldName: string;
    fieldType?: string;
    operator?: string;
    thresholdValue?: string;
    documentNotes?: string;
};

type AISubTab = {
    name: string;
    documentNotes?: string;
    fields: AIField[];
};

type AITab = {
    name: string;
    documentNotes?: string;
    subTabs: AISubTab[];
};

type AIStructure = {
    tabs: AITab[];
};

interface AIGeneratePolicyProps {
    onGenerated: (structure: AIStructure) => Promise<void> | void;
    disabled?: boolean;
    disabledReason?: string;
    inline?: boolean;
}

export default function AIGeneratePolicy({
    onGenerated,
    disabled = false,
    disabledReason,
    inline = false,
}: AIGeneratePolicyProps) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showInline, setShowInline] = useState(true);
    const [generatedStructure, setGeneratedStructure] = useState<AIStructure | null>(null);

    const normalizeStructure = (value: any): AIStructure => {
        const tabs = Array.isArray(value?.tabs) ? value.tabs : [];
        return {
            tabs: tabs.map((tab: any) => ({
                name: tab?.name || "New Tab",
                documentNotes: tab?.documentNotes || "",
                subTabs: (Array.isArray(tab?.subTabs) ? tab.subTabs : []).map((subTab: any) => ({
                    name: subTab?.name || "New SubTab",
                    documentNotes: subTab?.documentNotes || "",
                    fields: (Array.isArray(subTab?.fields) ? subTab.fields : []).map((field: any) => ({
                        fieldName: field?.fieldName || "",
                        fieldType: field?.fieldType || "string",
                        operator: field?.operator || "",
                        thresholdValue: field?.thresholdValue || "",
                        documentNotes: field?.documentNotes || ""
                    }))
                }))
            }))
        };
    };

    const updateTab = (tabIndex: number, key: keyof AITab, value: string) => {
        setGeneratedStructure((prev) => {
            if (!prev) return prev;
            const nextTabs = [...prev.tabs];
            nextTabs[tabIndex] = { ...nextTabs[tabIndex], [key]: value };
            return { tabs: nextTabs };
        });
    };

    const updateSubTab = (tabIndex: number, subTabIndex: number, key: keyof AISubTab, value: string) => {
        setGeneratedStructure((prev) => {
            if (!prev) return prev;
            const nextTabs = [...prev.tabs];
            const nextSubTabs = [...nextTabs[tabIndex].subTabs];
            nextSubTabs[subTabIndex] = { ...nextSubTabs[subTabIndex], [key]: value };
            nextTabs[tabIndex] = { ...nextTabs[tabIndex], subTabs: nextSubTabs };
            return { tabs: nextTabs };
        });
    };

    const updateField = (tabIndex: number, subTabIndex: number, fieldIndex: number, key: keyof AIField, value: string) => {
        setGeneratedStructure((prev) => {
            if (!prev) return prev;
            const nextTabs = [...prev.tabs];
            const nextSubTabs = [...nextTabs[tabIndex].subTabs];
            const nextFields = [...nextSubTabs[subTabIndex].fields];
            nextFields[fieldIndex] = { ...nextFields[fieldIndex], [key]: value };
            nextSubTabs[subTabIndex] = { ...nextSubTabs[subTabIndex], fields: nextFields };
            nextTabs[tabIndex] = { ...nextTabs[tabIndex], subTabs: nextSubTabs };
            return { tabs: nextTabs };
        });
    };

    const addTab = () => {
        setGeneratedStructure((prev) => ({
            tabs: [...(prev?.tabs || []), { name: "New Tab", documentNotes: "", subTabs: [] }]
        }));
    };

    const addSubTab = (tabIndex: number) => {
        setGeneratedStructure((prev) => {
            if (!prev) return prev;
            const nextTabs = [...prev.tabs];
            nextTabs[tabIndex] = {
                ...nextTabs[tabIndex],
                subTabs: [...nextTabs[tabIndex].subTabs, { name: "New SubTab", documentNotes: "", fields: [] }]
            };
            return { tabs: nextTabs };
        });
    };

    const addField = (tabIndex: number, subTabIndex: number) => {
        setGeneratedStructure((prev) => {
            if (!prev) return prev;
            const nextTabs = [...prev.tabs];
            const nextSubTabs = [...nextTabs[tabIndex].subTabs];
            nextSubTabs[subTabIndex] = {
                ...nextSubTabs[subTabIndex],
                fields: [
                    ...nextSubTabs[subTabIndex].fields,
                    { fieldName: "", fieldType: "string", operator: "", thresholdValue: "", documentNotes: "" }
                ]
            };
            nextTabs[tabIndex] = { ...nextTabs[tabIndex], subTabs: nextSubTabs };
            return { tabs: nextTabs };
        });
    };

    const removeTab = (tabIndex: number) => {
        setGeneratedStructure((prev) => {
            if (!prev) return prev;
            return { tabs: prev.tabs.filter((_, idx) => idx !== tabIndex) };
        });
    };

    const removeSubTab = (tabIndex: number, subTabIndex: number) => {
        setGeneratedStructure((prev) => {
            if (!prev) return prev;
            const nextTabs = [...prev.tabs];
            nextTabs[tabIndex] = {
                ...nextTabs[tabIndex],
                subTabs: nextTabs[tabIndex].subTabs.filter((_, idx) => idx !== subTabIndex)
            };
            return { tabs: nextTabs };
        });
    };

    const removeField = (tabIndex: number, subTabIndex: number, fieldIndex: number) => {
        setGeneratedStructure((prev) => {
            if (!prev) return prev;
            const nextTabs = [...prev.tabs];
            const nextSubTabs = [...nextTabs[tabIndex].subTabs];
            nextSubTabs[subTabIndex] = {
                ...nextSubTabs[subTabIndex],
                fields: nextSubTabs[subTabIndex].fields.filter((_, idx) => idx !== fieldIndex)
            };
            nextTabs[tabIndex] = { ...nextTabs[tabIndex], subTabs: nextSubTabs };
            return { tabs: nextTabs };
        });
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a description");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post("/policy/generate-structure", { prompt });
            setGeneratedStructure(normalizeStructure(data?.data));
            toast.success("Draft generated. You can edit before creating.");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error.message || "Failed to generate structure");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!generatedStructure || generatedStructure.tabs.length === 0) {
            toast.error("Please generate and keep at least one tab");
            return;
        }

        setCreating(true);
        try {
            await onGenerated(generatedStructure);
            if (!inline) {
                setShowModal(false);
            }
            setPrompt("");
            setGeneratedStructure(null);
        } catch (error: any) {
            toast.error(error?.message || "Failed to create structure");
        } finally {
            setCreating(false);
        }
    };

    const closeModal = () => {
        if (loading || creating) return;
        setShowModal(false);
        setGeneratedStructure(null);
        setPrompt("");
    };

    const editorContent = (
        <div className="space-y-4">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Create a credit card approval policy for premium customers. Include age requirements (minimum 21), income verification (minimum 12 LPA), credit score check (minimum 750), and employment stability (6 months minimum)."
                className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={loading}
            />

            <div className="flex gap-3">
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                    {loading ? "Generating..." : generatedStructure ? "Regenerate Draft" : "Generate Draft"}
                </button>
                <button
                    onClick={handleCreate}
                    disabled={!generatedStructure || loading || creating}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    {creating ? "Creating..." : "Create with AI"}
                </button>
            </div>

            {generatedStructure && (
                <div className="mt-2 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Review and Edit</h3>
                        <button
                            onClick={addTab}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
                        >
                            <Plus size={14} />
                            Add Tab
                        </button>
                    </div>

                    {generatedStructure.tabs.map((tab, tabIndex) => (
                        <div key={`tab-${tabIndex}`} className="border rounded-lg p-4 space-y-3 bg-white">
                            <div className="flex items-center gap-2">
                                <input
                                    value={tab.name}
                                    onChange={(e) => updateTab(tabIndex, "name", e.target.value)}
                                    placeholder="Tab Name"
                                    className="flex-1 px-3 py-2 border rounded text-sm text-gray-900"
                                />
                                <button onClick={() => removeTab(tabIndex)} className="p-2 rounded hover:bg-red-50 text-red-600">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <input
                                value={tab.documentNotes || ""}
                                onChange={(e) => updateTab(tabIndex, "documentNotes", e.target.value)}
                                placeholder="Tab Notes"
                                className="w-full px-3 py-2 border rounded text-sm text-gray-900"
                            />
                            <div className="space-y-3 pl-3 border-l-2 border-gray-100">
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => addSubTab(tabIndex)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded border hover:bg-gray-50"
                                    >
                                        <Plus size={12} />
                                        Add SubTab
                                    </button>
                                </div>
                                {tab.subTabs.map((subTab, subTabIndex) => (
                                    <div key={`subtab-${tabIndex}-${subTabIndex}`} className="border rounded p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                value={subTab.name}
                                                onChange={(e) => updateSubTab(tabIndex, subTabIndex, "name", e.target.value)}
                                                placeholder="SubTab Name"
                                                className="flex-1 px-3 py-2 border rounded text-sm text-gray-900"
                                            />
                                            <button onClick={() => removeSubTab(tabIndex, subTabIndex)} className="p-2 rounded hover:bg-red-50 text-red-600">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <input
                                            value={subTab.documentNotes || ""}
                                            onChange={(e) => updateSubTab(tabIndex, subTabIndex, "documentNotes", e.target.value)}
                                            placeholder="SubTab Notes"
                                            className="w-full px-3 py-2 border rounded text-sm text-gray-900"
                                        />
                                        <div className="space-y-2">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => addField(tabIndex, subTabIndex)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded border hover:bg-gray-50"
                                                >
                                                    <Plus size={12} />
                                                    Add Field
                                                </button>
                                            </div>
                                            {subTab.fields.map((field, fieldIndex) => (
                                                <div key={`field-${tabIndex}-${subTabIndex}-${fieldIndex}`} className="grid grid-cols-12 gap-2 items-center">
                                                    <input
                                                        value={field.fieldName || ""}
                                                        onChange={(e) => updateField(tabIndex, subTabIndex, fieldIndex, "fieldName", e.target.value)}
                                                        placeholder="Field Name"
                                                        className="col-span-3 px-2 py-1.5 border rounded text-xs text-gray-900"
                                                    />
                                                    <select
                                                        value={field.fieldType || "string"}
                                                        onChange={(e) => updateField(tabIndex, subTabIndex, fieldIndex, "fieldType", e.target.value)}
                                                        className="col-span-2 px-2 py-1.5 border rounded text-xs text-gray-900"
                                                    >
                                                        <option value="string">string</option>
                                                        <option value="number">number</option>
                                                        <option value="boolean">boolean</option>
                                                        <option value="date">date</option>
                                                    </select>
                                                    <input
                                                        value={field.operator || ""}
                                                        onChange={(e) => updateField(tabIndex, subTabIndex, fieldIndex, "operator", e.target.value)}
                                                        placeholder="Operator"
                                                        className="col-span-2 px-2 py-1.5 border rounded text-xs text-gray-900"
                                                    />
                                                    <input
                                                        value={field.thresholdValue || ""}
                                                        onChange={(e) => updateField(tabIndex, subTabIndex, fieldIndex, "thresholdValue", e.target.value)}
                                                        placeholder="Value"
                                                        className="col-span-2 px-2 py-1.5 border rounded text-xs text-gray-900"
                                                    />
                                                    <input
                                                        value={field.documentNotes || ""}
                                                        onChange={(e) => updateField(tabIndex, subTabIndex, fieldIndex, "documentNotes", e.target.value)}
                                                        placeholder="Notes"
                                                        className="col-span-2 px-2 py-1.5 border rounded text-xs text-gray-900"
                                                    />
                                                    <button onClick={() => removeField(tabIndex, subTabIndex, fieldIndex)} className="col-span-1 p-1.5 rounded hover:bg-red-50 text-red-600 justify-self-end">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (inline) {
        return (
            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm animate-fade-in-up">
                <button
                    onClick={() => setShowInline((prev) => !prev)}
                    className="w-full flex items-center justify-between text-left"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-blue-600" />
                        <h2 className="text-sm font-semibold text-gray-900">AI Rule Generator</h2>
                    </div>
                    {showInline ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <p className="text-xs text-gray-500 mt-1">Generate tabs, subtabs, and fields by prompt and edit before save.</p>
                {showInline && <div className="mt-3">{editorContent}</div>}
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => {
                    if (disabled) {
                        toast.error(disabledReason || "This policy cannot be edited");
                        return;
                    }
                    setShowModal(true);
                }}
                disabled={disabled}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Sparkles size={18} />
                Create with AI
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Generate Policy Structure with AI</h2>
                        {editorContent}
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={closeModal}
                                disabled={loading || creating}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

