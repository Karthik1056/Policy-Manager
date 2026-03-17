"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, MessageCircle, Paperclip, Link as LinkIcon, Table2 } from "lucide-react";
import PolicyDraft from "./PolicyDraft";

interface ChatCitation {
  type: "tab" | "subtab" | "field";
  id?: string;
  name: string;
  tabName?: string;
  subtabName?: string;
}

interface ChatTableRow {
  category: string;
  value: string;
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  suggestions?: {
    subtabs?: string[] | null;
    fields?: string[] | null;
    next_steps?: string[] | null;
  } | null;
  citations?: ChatCitation[];
  table_data?: ChatTableRow[];
}

interface ExtractionTriple {
  subject?: string;
  relation?: string;
  object?: string;
  chunk_index?: number;
  section?: string;
}

interface RepresentationHint {
  suggestedDraftMode: "document" | "table" | "mixed";
  confidence?: number;
  reason?: string;
  perSection?: Array<{ sectionName: string; mode: "document" | "table" }>;
}

interface RepresentationInference {
  hint: RepresentationHint;
  preferredViewMode: "document" | "table";
  tableScore: number;
  documentScore: number;
  hasRuleCriteria: boolean;
}

const SECTION_PRIORITY: Record<string, number> = {
  objective: 1,
  "business model": 2,
  "customer segment": 3,
  "profile of borrowers": 4,
  purpose: 5,
};

const NARRATIVE_SECTION_HINTS = [
  "objective",
  "introduction",
  "background",
  "overview",
  "policy manual",
  "confidential",
  "business model",
];

interface PolicyChatPopupProps {
  currentPolicy: any;
  onPolicyUpdate: (action: any) => void;
  policyId: string;
}

export default function PolicyChatPopup({
  currentPolicy,
  onPolicyUpdate,
  policyId,
}: PolicyChatPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [editableAction, setEditableAction] = useState<any>(null);
  const [suggestionHistory, setSuggestionHistory] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<"document" | "table">("document");
  const [aiRepresentationHints, setAiRepresentationHints] = useState<RepresentationHint | null>(null);
  const [isViewModeOverridden, setIsViewModeOverridden] = useState(false);

  const humanizeRelation = (relation?: string) => {
    const raw = String(relation || "").trim();
    if (!raw) return "Rule";
    return raw
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const toFieldType = (value?: string) => {
    const text = String(value || "").trim();
    if (!text) return "text";
    if (/^[-+]?\d+(?:\.\d+)?$/.test(text)) return "number";
    if (/\d/.test(text) && /(rs\.?|lakh|crore|%|month|year|tenor|tenure|score|age)/i.test(text)) return "number";
    return "text";
  };

  const normalizeSpace = (value?: string) => String(value || "").replace(/\s+/g, " ").trim();

  const toTitleCase = (value?: string) => {
    const text = normalizeSpace(value);
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const inferSectionName = (triple: ExtractionTriple) => {
    const section = normalizeSpace(triple.section);
    const relation = normalizeSpace(humanizeRelation(triple.relation));
    const subject = normalizeSpace(triple.subject);
    const relationKey = relation.toLowerCase();

    if (section) return section;

    if (/objective/.test(relationKey)) return "Objective";
    if (/business\s*model/.test(relationKey)) return "Business Model";
    if (/customer\s*segment/.test(relationKey)) return "Customer Segment";
    if (/profile\s*of\s*borrowers|borrower\s*profile/.test(relationKey)) return "Profile of Borrowers";
    if (/purpose/.test(relationKey)) return "Purpose";

    if (subject && subject.length <= 70) return toTitleCase(subject);
    return "General Rules";
  };

  const inferSectionDisplayMode = (sectionName: string, sectionTriples: ExtractionTriple[]) => {
    const lowerName = sectionName.toLowerCase();
    const isNarrativeByName = NARRATIVE_SECTION_HINTS.some((hint) => lowerName.includes(hint));
    const longTextCount = sectionTriples.filter((triple) => normalizeSpace(triple.object).length >= 120).length;
    const numericLikeCount = sectionTriples.filter((triple) => {
      const text = normalizeSpace(triple.object);
      return /\d/.test(text) && /(rs\.?|%|month|year|tenure|tenor|score|age|lakh|crore|amount)/i.test(text);
    }).length;

    if (isNarrativeByName) return "document" as const;
    if (longTextCount >= Math.max(2, Math.ceil(sectionTriples.length * 0.5)) && numericLikeCount === 0) {
      return "document" as const;
    }
    return "table" as const;
  };

  const buildActionFromExtraction = (
    policyName: string,
    triples: ExtractionTriple[],
    filename: string,
  ) => {
    const validTriples = (triples || []).filter(
      (t) => String(t?.subject || "").trim() && String(t?.relation || "").trim() && String(t?.object || "").trim()
    );

    const grouped = new Map<string, ExtractionTriple[]>();
    for (const triple of validTriples) {
      const section = inferSectionName(triple);
      if (!grouped.has(section)) grouped.set(section, []);
      grouped.get(section)!.push(triple);
    }

    const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) => {
      const aPriority = SECTION_PRIORITY[a.toLowerCase()] ?? 999;
      const bPriority = SECTION_PRIORITY[b.toLowerCase()] ?? 999;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.localeCompare(b);
    });

    const subtabs = sortedGroups.map(([section, sectionTriples], subtabIndex) => {
      const sectionDisplayMode = inferSectionDisplayMode(section, sectionTriples);
      const seenFieldNames = new Set<string>();
      const fields = sectionTriples.map((triple, fieldIndex) => {
        const relationName = humanizeRelation(triple.relation);
        const subjectName = normalizeSpace(triple.subject);
        const objectValue = normalizeSpace(triple.object);
        const baseFieldName =
          sectionDisplayMode === "document"
            ? (relationName !== "Rule" ? relationName : subjectName || `Point ${fieldIndex + 1}`)
            : (relationName !== "Rule" ? relationName : subjectName || `Requirement ${fieldIndex + 1}`);
        let fieldName = baseFieldName;
        let dedupeIndex = 2;

        while (seenFieldNames.has(fieldName.toLowerCase())) {
          fieldName = `${baseFieldName} ${dedupeIndex}`;
          dedupeIndex += 1;
        }
        seenFieldNames.add(fieldName.toLowerCase());

        return {
          fieldName,
          fieldType: toFieldType(objectValue),
          operator: "=",
          thresholdValue: sectionDisplayMode === "table" ? objectValue.slice(0, 500) : "",
          fieldValues: sectionDisplayMode === "document" ? objectValue : "",
          orderIndex: fieldIndex,
          displayMode: sectionDisplayMode,
          documentNotes:
            sectionDisplayMode === "document"
              ? objectValue
              : (subjectName ? `Context: ${subjectName}` : ""),
        };
      });

      const representativeNarrative = sectionTriples
        .map((item) => normalizeSpace(item.object))
        .find((text) => text.length >= 120);

      return {
        name: section,
        orderIndex: subtabIndex,
        documentNotes:
          representativeNarrative && sectionDisplayMode === "document"
            ? representativeNarrative
            : `Extracted from ${filename}`,
        displayMode: sectionDisplayMode,
        fields,
      };
    });

    return {
      type: "create_nested_structure",
      tab: {
        name: policyName || currentPolicy?.name || currentPolicy?.policy?.name || "Extracted Policy",
        orderIndex: 0,
        documentNotes: `Auto-generated from uploaded file: ${filename}`,
      },
      subtabs,
    };
  };

  const runExtractionFromAttachment = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("llm_provider", "azure-foundry");
    form.append("async", "false");

    const { data } = await api.post(
      "http://localhost:8000/api/extraction/upload-policy",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    const result = data?.result || {};
    const extractionTriples: ExtractionTriple[] = Array.isArray(result?.triples) ? result.triples : [];
    const extractedPolicyName = String(result?.policy_name || "").trim() || file.name.replace(/\.[^.]+$/, "");

    if (!result?.success || extractionTriples.length === 0) {
      throw new Error("Extraction completed but no structured triples were found.");
    }

    const action = buildActionFromExtraction(extractedPolicyName, extractionTriples, file.name);
    const sectionCount = Array.isArray(action?.subtabs) ? action.subtabs.length : 0;

    return {
      action,
      summary: `Analyzed '${file.name}'. Extracted ${extractionTriples.length} structured points across ${sectionCount} policy sections for '${extractedPolicyName}'. Review the draft on the right and click Add to Policy to save in Prisma.`,
    };
  };

  const inferRepresentation = (messageText: string, action: any): RepresentationInference => {
    const text = String(messageText || "").toLowerCase();
    const asksMixed = /\bmixed\b|both|table\s+and\s+document|document\s+and\s+table/.test(text);
    const asksTable = /\btable\b|matrix|threshold|criteria|rule\s*grid|scorecard|numeric/.test(text);
    const asksDocument = /\bdocument\b|narrative|paragraph|prose|explain|policy\s+notes?/.test(text);

    let tableSignals = 0;
    let documentSignals = 0;
    let numericSignals = 0;
    let textSignals = 0;

    const visit = (node: any) => {
      if (!node) return;
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (typeof node !== "object") return;

      const mode = String(node?.displayMode || "").toLowerCase();
      if (mode === "table") tableSignals += 2;
      if (mode === "document") documentSignals += 2;

      if ("fieldName" in node || "operator" in node || "thresholdValue" in node || "fieldValues" in node) {
        const hasOperator = typeof node?.operator === "string" && node.operator.trim().length > 0;
        const hasThreshold =
          (node?.thresholdValue !== undefined && node?.thresholdValue !== null && String(node.thresholdValue).trim() !== "") ||
          (node?.fieldValues !== undefined && node?.fieldValues !== null && String(node.fieldValues).trim() !== "");
        if (hasOperator || hasThreshold) numericSignals += 1;
      }

      if (typeof node?.documentNotes === "string" && node.documentNotes.trim().length > 0) {
        textSignals += 1;
      }

      Object.values(node).forEach(visit);
    };

    visit(action);

    const structuralMixed = (tableSignals > 0 && documentSignals > 0) || (numericSignals > 0 && textSignals > 0);

    let suggestedDraftMode: "document" | "table" | "mixed" = "document";
    let confidence = 0.65;
    let reason = "Defaulted to document mode due to limited structural cues.";

    if (asksMixed || structuralMixed || (asksTable && asksDocument)) {
      suggestedDraftMode = "mixed";
      confidence = asksMixed ? 0.92 : 0.8;
      reason = "Detected both narrative and rule-based cues, so mixed mode is most suitable.";
    } else if (asksTable || (tableSignals + numericSignals > documentSignals + textSignals + 1)) {
      suggestedDraftMode = "table";
      confidence = asksTable ? 0.86 : 0.74;
      reason = "Detected threshold/rule-heavy content, so table mode is preferred.";
    } else if (asksDocument || documentSignals + textSignals >= tableSignals + numericSignals) {
      suggestedDraftMode = "document";
      confidence = asksDocument ? 0.82 : 0.72;
      reason = "Detected explanatory/narrative content, so document mode is preferred.";
    }

    const tableScore = tableSignals + numericSignals * 2;
    const documentScore = documentSignals + textSignals;
    const hasRuleCriteria = numericSignals >= 2 || tableSignals > 0;

    // The UI toggle supports document/table only; mixed selects a practical default.
    const preferredViewMode: "document" | "table" =
      suggestedDraftMode === "table"
        ? "table"
        : suggestedDraftMode === "mixed"
          ? (tableScore > documentScore ? "table" : "document")
          : "document";

    return {
      hint: {
        suggestedDraftMode,
        confidence,
        reason,
      },
      preferredViewMode,
      tableScore,
      documentScore,
      hasRuleCriteria,
    };
  };


  const findTabIdByName = (tabName?: string) => {
    if (!tabName) return undefined;
    const normalized = tabName.trim().toLowerCase();
    return currentPolicy?.tabs?.find((tab: any) => String(tab?.name || "").trim().toLowerCase() === normalized)?.id;
  };

  const findSubTabIdByName = (subTabName?: string, tabName?: string) => {
    if (!subTabName) return undefined;
    const normalizedSubTab = subTabName.trim().toLowerCase();
    const tabs = (currentPolicy?.tabs || []) as any[];
    const tabScope = tabName
      ? tabs.filter((tab: any) => String(tab?.name || "").trim().toLowerCase() === tabName.trim().toLowerCase())
      : tabs;

    for (const tab of tabScope) {
      const found = (tab?.subTabs || []).find(
        (subTab: any) => String(subTab?.name || "").trim().toLowerCase() === normalizedSubTab
      );
      if (found?.id) return found.id;
    }
    return undefined;
  };

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat-${policyId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Add welcome message for new chats
      setMessages([{
        role: "ai",
        content: "Hello! I'm here to help you build your policy. I can create tabs, subtabs, and fields based on your requirements. What would you like to add to your policy today?"
      }]);
    }
  }, [policyId]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat-${policyId}`, JSON.stringify(messages));
    }
  }, [messages, policyId]);

  const createPolicyItem = async (action: any) => {
    const resolvePolicyId = () => {
      const candidate =
        action?.tab?.policyEngineId ||
        policyId ||
        currentPolicy?.id ||
        currentPolicy?.policyEngineId;

      const normalized = String(candidate || "").trim();
      if (!normalized || normalized === "undefined" || normalized === "null") {
        throw new Error("Policy ID is missing. Reload the builder and try again.");
      }
      return normalized;
    };

    const effectivePolicyId = resolvePolicyId();

    const postJsonOrThrow = async (url: string, payload: any) => {
      const { data } = await api.post(url, payload);
      return data;
    };

    const deleteRequest = async (url: string) => {
      const { data } = await api.delete(url);
      return data;
    };

    const updateRequest = async (url: string, payload: any) => {
      const { data } = await api.put(url, payload);
      return data;
    };

    const getNextTabOrderIndex = () => {
      const tabs = (currentPolicy?.tabs || []) as any[];
      if (tabs.length === 0) return 0;
      const maxOrder = Math.max(
        ...tabs.map((tab: any) => (Number.isFinite(tab?.orderIndex) ? Number(tab.orderIndex) : -1))
      );
      return maxOrder + 1;
    };

    const findExistingTabByName = (tabName?: string) => {
      if (!tabName) return null;
      const normalized = String(tabName).trim().toLowerCase();
      return (currentPolicy?.tabs || []).find(
        (tab: any) => String(tab?.name || "").trim().toLowerCase() === normalized
      ) || null;
    };

    const findExistingSubtabByName = (tabId?: string, subtabName?: string) => {
      if (!tabId || !subtabName) return null;
      const tab = (currentPolicy?.tabs || []).find((t: any) => t?.id === tabId);
      if (!tab) return null;
      const normalized = String(subtabName).trim().toLowerCase();
      return (tab?.subTabs || []).find(
        (subtab: any) => String(subtab?.name || "").trim().toLowerCase() === normalized
      ) || null;
    };

    const findExistingFieldByName = (tabId?: string, subtabId?: string, fieldName?: string) => {
      if (!tabId || !subtabId || !fieldName) return null;
      const tab = (currentPolicy?.tabs || []).find((t: any) => t?.id === tabId);
      if (!tab) return null;
      const subtab = (tab?.subTabs || []).find((s: any) => s?.id === subtabId);
      if (!subtab) return null;
      const normalized = String(fieldName).trim().toLowerCase();
      return (subtab?.fields || []).find(
        (field: any) => String(field?.fieldName || "").trim().toLowerCase() === normalized
      ) || null;
    };

    // Handle delete operations
    if (action.type === "delete_tab" && action.delete?.tabName) {
      const tab = currentPolicy?.tabs?.find((t: any) => t.name === action.delete.tabName);
      if (tab?.id) await deleteRequest(`/tab/delete/${tab.id}`);
      return;
    }

    if (action.type === "delete_subtab" && action.delete) {
      const tab = currentPolicy?.tabs?.find((t: any) => t.name === action.delete.tabName);
      const subtab = tab?.subTabs?.find((s: any) => s.name === action.delete.subTabName);
      if (subtab?.id) await deleteRequest(`/subtab/delete/${subtab.id}`);
      return;
    }

    if (action.type === "delete_field" && action.delete) {
      const tab = currentPolicy?.tabs?.find((t: any) => t.name === action.delete.tabName);
      const subtab = tab?.subTabs?.find((s: any) => s.name === action.delete.subTabName);
      const field = subtab?.fields?.find((f: any) => f.fieldName === action.delete.fieldName);
      if (field?.id) await deleteRequest(`/field/delete/${field.id}`);
      return;
    }

    // Handle update operations
    if (action.type === "update_tab" && action.update) {
      const tab = currentPolicy?.tabs?.find((t: any) => t.name === action.update.tabName);
      if (tab?.id) await updateRequest(`/tab/update/${tab.id}`, action.update.updates);
      return;
    }

    if (action.type === "update_subtab" && action.update) {
      const tab = currentPolicy?.tabs?.find((t: any) => t.name === action.update.tabName);
      const subtab = tab?.subTabs?.find((s: any) => s.name === action.update.subTabName);
      if (subtab?.id) await updateRequest(`/subtab/update/${subtab.id}`, action.update.updates);
      return;
    }

    if (action.type === "update_field" && action.update) {
      const tab = currentPolicy?.tabs?.find((t: any) => t.name === action.update.tabName);
      const subtab = tab?.subTabs?.find((s: any) => s.name === action.update.subTabName);
      const field = subtab?.fields?.find((f: any) => f.fieldName === action.update.fieldName);
      if (field?.id) await updateRequest(`/field/update/${field.id}`, action.update.updates);
      return;
    }

    if (action.type === "update_fields" && Array.isArray(action.updates)) {
      for (const updateItem of action.updates) {
        const tab = currentPolicy?.tabs?.find((t: any) => t.name === updateItem.tabName);
        const subtab = tab?.subTabs?.find((s: any) => s.name === updateItem.subTabName);
        const field = subtab?.fields?.find((f: any) => f.fieldName === updateItem.fieldName);
        if (field?.id) {
          await updateRequest(`/field/update/${field.id}`, updateItem.updates || {});
        }
      }
      return;
    }

    if (action.type === "create_nested_structure") {
      const groups = [
        { tab: action?.tab, subtabs: action?.subtabs || [] },
        ...((action?.additional_tabs || []).map((item: any) => ({ tab: item?.tab, subtabs: item?.subtabs || [] }))),
      ].filter((group: any) => group?.tab);

      for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
        const group = groups[groupIndex];
        const { tab, subtabs } = group;

        const existingTab = findExistingTabByName(tab?.name);
        let createdTabId = existingTab?.id;

        if (createdTabId) {
          const tabUpdates: any = {};
          if (tab?.documentNotes !== undefined) tabUpdates.documentNotes = tab.documentNotes;
          if (tab?.orderIndex !== undefined) tabUpdates.orderIndex = tab.orderIndex;
          if (Object.keys(tabUpdates).length > 0) {
            await updateRequest(`/tab/update/${createdTabId}`, tabUpdates);
          }
        } else {
          const tabPayload = {
            name: tab?.name || "New Tab",
            orderIndex: Number.isFinite(tab?.orderIndex) ? tab.orderIndex : getNextTabOrderIndex() + groupIndex,
            documentNotes: tab?.documentNotes || "",
            policyEngineId: effectivePolicyId,
          };

          const createdTab = await postJsonOrThrow("/tab/createTab", tabPayload);
          createdTabId = createdTab?.data?.id || createdTab?.id;
        }

        if (!createdTabId) {
          throw new Error("Failed to create tab");
        }

        for (const subtab of subtabs || []) {
          const { fields, ...subtabData } = subtab;

          const existingSubtab = findExistingSubtabByName(createdTabId, subtabData?.name);
          let createdSubtabId = existingSubtab?.id;

          if (createdSubtabId) {
            const subtabUpdates: any = {};
            if (subtabData?.documentNotes !== undefined) subtabUpdates.documentNotes = subtabData.documentNotes;
            if (subtabData?.orderIndex !== undefined) subtabUpdates.orderIndex = subtabData.orderIndex;
            if (Object.keys(subtabUpdates).length > 0) {
              await updateRequest(`/subtab/update/${createdSubtabId}`, subtabUpdates);
            }
          } else {
            const subtabPayload = {
              name: subtabData?.name || "New SubTab",
              orderIndex: subtabData?.orderIndex ?? 0,
              documentNotes: subtabData?.documentNotes || "",
              displayMode: subtabData?.displayMode || "document",
              tabId: createdTabId,
            };

            const subtabResult = await postJsonOrThrow("/subtab/create", subtabPayload);
            createdSubtabId = subtabResult?.data?.id || subtabResult?.id;
          }

          if (!createdSubtabId) {
            throw new Error("Failed to create subtab");
          }

          if (fields && fields.length > 0) {
            for (const field of fields) {
              const existingField = findExistingFieldByName(createdTabId, createdSubtabId, field?.fieldName);
              if (existingField?.id) {
                const { subTabId: _skip1, ...fieldUpdates } = field || {};
                await updateRequest(`/field/update/${existingField.id}`, fieldUpdates);
              } else {
                await postJsonOrThrow("/field/create", { ...field, subTabId: createdSubtabId });
              }
            }
          }
        }
      }
      return;
    }

    if (action.type === "create_tab" && action.tab) {
      const existingTab = findExistingTabByName(action?.tab?.name);
      if (existingTab?.id) {
        const tabUpdates: any = {};
        if (action?.tab?.documentNotes !== undefined) tabUpdates.documentNotes = action.tab.documentNotes;
        if (action?.tab?.orderIndex !== undefined) tabUpdates.orderIndex = action.tab.orderIndex;
        if (Object.keys(tabUpdates).length > 0) {
          await updateRequest(`/tab/update/${existingTab.id}`, tabUpdates);
        }
        return;
      }

      const tabPayload = {
        ...action.tab,
        name: action.tab.name || "New Tab",
        orderIndex: action.tab.orderIndex ?? getNextTabOrderIndex(),
        documentNotes: action.tab.documentNotes || "",
        policyEngineId: effectivePolicyId,
      };

      await postJsonOrThrow("/tab/createTab", tabPayload);
      return;
    }

    if (action.type === "create_subtab" && action.subtab) {
      const subtabData = {
        ...action.subtab,
        tabId: action.subtab.tabId || findTabIdByName(action.subtab.tabName)
      };

      if (!subtabData.tabId) {
        throw new Error("Unable to resolve tabId for subtab. Add tabId or tabName in draft JSON.");
      }
      
      const createdSubtab = await postJsonOrThrow("/subtab/create", subtabData);
      const createdSubtabId = createdSubtab?.data?.id || createdSubtab?.id;
      
      if (action.subtab.fields && action.subtab.fields.length > 0 && createdSubtabId) {
        for (const field of action.subtab.fields) {
          await postJsonOrThrow("/field/create", { ...field, subTabId: createdSubtabId });
        }
      }
      return;
    }

    if (action.type === "create_field" && action.field) {
      const resolvedSubTabId =
        action.field.subTabId ||
        findSubTabIdByName(action.field.subTabName || action.field.subtabName, action.field.tabName);

      if (!resolvedSubTabId) {
        throw new Error("Unable to resolve subTabId for field. Add subTabId or subTabName in draft JSON.");
      }

      await postJsonOrThrow("/field/create", { ...action.field, subTabId: resolvedSubTabId });
    }
  };

  const sendMessage = async (overrideText?: unknown) => {
    const textSource = typeof overrideText === "string" ? overrideText : input;
    const messageText = String(textSource ?? "").trim();
    const fileToAnalyze = attachedFile;
    if (!messageText && !fileToAnalyze) return;

    const userMessage = {
      role: "user" as const,
      content: messageText || `Analyze attached file: ${fileToAnalyze?.name}`,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // Add typing indicator
    setMessages((prev) => [...prev, { role: "ai", content: "Typing..." }]);

    try {
      let generatedFromAttachment: any = null;
      if (fileToAnalyze) {
        const extraction = await runExtractionFromAttachment(fileToAnalyze);
        generatedFromAttachment = extraction.action;

        setPendingAction(extraction.action);
        setEditableAction({ ...extraction.action });
        setSuggestions(null);
        setDraftError(null);

        const sectionModes = (extraction.action?.subtabs || []).map((subtab: any) => subtab?.displayMode);
        const hasDocumentSections = sectionModes.includes("document");
        const hasTableSections = sectionModes.includes("table");

        setAiRepresentationHints({
          suggestedDraftMode: hasDocumentSections && hasTableSections ? "mixed" : hasDocumentSections ? "document" : "table",
          confidence: 0.95,
          reason: "Detected section-aware policy content from uploaded file.",
        });
        if (!isViewModeOverridden) {
          setViewMode(hasDocumentSections ? "document" : "table");
        }

        if (!messageText) {
          setMessages((prev) => {
            const withoutTyping = prev.slice(0, -1);
            return [...withoutTyping, { role: "ai", content: extraction.summary }];
          });
          setAttachedFile(null);
          setLoading(false);
          return;
        }
      }

      const policyMeta = currentPolicy?.policy || currentPolicy || {};
      const { data } = await api.post("http://localhost:8000/api/chat/policy-builder", {
            message: messageText,
            current_policy: currentPolicy,
            policy_name: policyMeta?.name,
            policy_product: policyMeta?.product || policyMeta?.productType,
            policy_description: policyMeta?.description,
            current_draft: {
              pending_action: generatedFromAttachment || pendingAction,
              suggestions,
              tab_name: (generatedFromAttachment || pendingAction)?.tab?.name || null,
              representation: {
                current_view_mode: viewMode,
                user_overridden: isViewModeOverridden,
                ai_suggested_mode: aiRepresentationHints?.suggestedDraftMode || null,
              },
            },
          });

      const result = data?.result || {};
      const incomingHints = (result?.representation_hints || null) as RepresentationHint | null;
      const inferred = inferRepresentation(messageText, result?.action);
      let effectiveHints = incomingHints || inferred.hint;

      // If AI hints document but generated JSON is clearly rule-heavy, prefer inferred table/mixed behavior.
      if (
        incomingHints?.suggestedDraftMode === "document" &&
        inferred.hasRuleCriteria &&
        inferred.tableScore >= inferred.documentScore + 1
      ) {
        effectiveHints = {
          ...inferred.hint,
          reason: "Adjusted by frontend inference: detected rule-heavy criteria in generated JSON.",
        };
      }

      setAiRepresentationHints(effectiveHints);

      if (!isViewModeOverridden) {
        if (inferred.hasRuleCriteria && inferred.tableScore >= inferred.documentScore + 2) {
          setViewMode("table");
        } else if (effectiveHints.suggestedDraftMode === "table") {
          setViewMode("table");
        } else if (effectiveHints.suggestedDraftMode === "document") {
          setViewMode("document");
        } else {
          setViewMode(inferred.preferredViewMode);
        }
      }

      // Remove typing indicator and add actual response
      setMessages((prev) => {
        const withoutTyping = prev.slice(0, -1);
        const aiMessage = result.message || "I've processed your request!";
        
        // Make response more conversational
        let conversationalMessage = aiMessage;
        if (result.action && result.action.type !== "error") {
          const actionType = result.action.type.replace("create_", "").replace("_", " ");
          conversationalMessage = `Great! I've prepared a ${actionType} for you. You can review and edit it in the draft panel on the right. ${aiMessage}`;
        }
        
        return [...withoutTyping, { role: "ai", content: conversationalMessage, suggestions: result.suggestions || null, citations: result.citations || [], table_data: result.table_data || null }];

      });

      if (result.action && result.action.type !== "error") {
        // Handle additions to existing draft
        if (result.action.type === "add_to_existing" && pendingAction) {
          const addition = result.action.addition;
          if (addition.subtab) {
            // Add new subtab to existing nested structure
            const updatedAction = {
              ...pendingAction,
              subtabs: [...(pendingAction.subtabs || []), addition.subtab]
            };
            setPendingAction(updatedAction);
            setEditableAction({ ...updatedAction });
          } else if (addition.field && pendingAction.subtabs) {
            // Add field to last subtab
            const updatedSubtabs = [...pendingAction.subtabs];
            const lastSubtab = updatedSubtabs[updatedSubtabs.length - 1];
            lastSubtab.fields = [...(lastSubtab.fields || []), addition.field];
            const updatedAction = { ...pendingAction, subtabs: updatedSubtabs };
            setPendingAction(updatedAction);
            setEditableAction({ ...updatedAction });
          }
        }
        // Merge incremental updates into an existing nested draft so preview stays current
        else if (
          pendingAction?.type === "create_nested_structure" &&
          [
            "create_nested_structure",
            "create_subtab",
            "create_field",
            "update_tab",
            "update_subtab",
            "update_field",
            "update_fields",
            "delete_tab",
            "delete_subtab",
            "delete_field",
          ].includes(result.action.type)
        ) {
          const updatedAction = mergeActionIntoNestedDraft(pendingAction, result.action);
          setPendingAction(updatedAction);
          setEditableAction(updatedAction ? { ...updatedAction } : null);
          setSuggestions(result.suggestions || null);
        }
        // For follow-up suggestions, don't replace existing draft
        else if (pendingAction && result.action.type !== "create_nested_structure") {
          // Keep existing draft, just update suggestions
          setSuggestions(result.suggestions || null);
        } else {
          setPendingAction(result.action);
          setEditableAction({ ...result.action }); // Create editable copy
        }
      } else {
        // Only clear if it's an error, not a follow-up
        if (!pendingAction) {
          setPendingAction(null);
          setEditableAction(null);
        }
      }

      setSuggestions(result.suggestions || null);
      
      // Add to suggestion history if suggestions exist
      if (result.suggestions) {
        setSuggestionHistory(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          suggestions: result.suggestions
        }]);
      }
      
      setDraftError(null);
    } catch {
      setMessages((prev) => {
        const withoutTyping = prev.slice(0, -1);
        return [...withoutTyping, { role: "ai", content: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question." }];
      });
    }

    if (typeof overrideText !== "string") {
      setInput("");
    }
    setAttachedFile(null);
    setLoading(false);
  };

  const mergeActionIntoNestedDraft = (baseAction: any, incomingAction: any) => {
    if (!baseAction || baseAction.type !== "create_nested_structure") {
      return incomingAction;
    }

    const merged = {
      ...baseAction,
      subtabs: [...(baseAction.subtabs || [])],
    };

    if (incomingAction?.type === "create_subtab" && incomingAction?.subtab) {
      merged.subtabs.push(incomingAction.subtab);
      return merged;
    }

    if (incomingAction?.type === "create_nested_structure") {
      const incomingTabName = String(incomingAction?.tab?.name || "").trim().toLowerCase();
      const currentTabName = String(merged?.tab?.name || "").trim().toLowerCase();

      if (incomingTabName && incomingTabName === currentTabName) {
        merged.subtabs = [...(merged.subtabs || []), ...(incomingAction?.subtabs || [])];
        return merged;
      }

      merged.additional_tabs = [
        ...(merged.additional_tabs || []),
        {
          tab: incomingAction?.tab || null,
          subtabs: incomingAction?.subtabs || [],
        },
      ];
      return merged;
    }

    if (incomingAction?.type === "create_field" && incomingAction?.field) {
      const incomingField = incomingAction.field;
      const targetSubtabName = String(incomingField.subTabName || incomingField.subtabName || "").trim().toLowerCase();

      if (!targetSubtabName) {
        return merged;
      }

      merged.subtabs = merged.subtabs.map((subtab: any) => {
        const currentName = String(subtab?.name || "").trim().toLowerCase();
        if (currentName !== targetSubtabName) return subtab;
        return {
          ...subtab,
          fields: [...(subtab.fields || []), incomingField],
        };
      });

      return merged;
    }

    if (incomingAction?.type === "update_tab" && incomingAction?.update?.updates) {
      const updates = incomingAction.update.updates;
      merged.tab = {
        ...(merged.tab || {}),
        ...updates,
        documentNotes: updates?.documentNotes || updates?.description || merged?.tab?.documentNotes,
        name: updates?.name || merged?.tab?.name,
      };
      return merged;
    }

    if (incomingAction?.type === "update_subtab" && incomingAction?.update) {
      const targetName = String(incomingAction.update.subTabName || "").trim().toLowerCase();
      const updates = incomingAction.update.updates || {};
      merged.subtabs = merged.subtabs.map((subtab: any) => {
        const currentName = String(subtab?.name || "").trim().toLowerCase();
        if (currentName !== targetName) return subtab;
        return {
          ...subtab,
          ...updates,
          documentNotes: updates?.documentNotes || updates?.description || subtab?.documentNotes,
          name: updates?.name || subtab?.name,
        };
      });
      return merged;
    }

    if (incomingAction?.type === "update_field" && incomingAction?.update) {
      const targetSubtabName = String(incomingAction.update.subTabName || "").trim().toLowerCase();
      const targetFieldName = String(incomingAction.update.fieldName || "").trim().toLowerCase();
      const updates = incomingAction.update.updates || {};

      merged.subtabs = merged.subtabs.map((subtab: any) => {
        const currentSubtab = String(subtab?.name || "").trim().toLowerCase();
        if (targetSubtabName && currentSubtab !== targetSubtabName) return subtab;

        return {
          ...subtab,
          fields: (subtab.fields || []).map((field: any) => {
            const currentField = String(field?.fieldName || "").trim().toLowerCase();
            if (currentField !== targetFieldName) return field;
            return {
              ...field,
              ...updates,
              fieldName: updates?.fieldName || field?.fieldName,
            };
          }),
        };
      });
      return merged;
    }

    if (incomingAction?.type === "update_fields" && Array.isArray(incomingAction?.updates)) {
      for (const updateItem of incomingAction.updates) {
        const targetSubtabName = String(updateItem?.subTabName || "").trim().toLowerCase();
        const targetFieldName = String(updateItem?.fieldName || "").trim().toLowerCase();
        const updates = updateItem?.updates || {};

        merged.subtabs = merged.subtabs.map((subtab: any) => {
          const currentSubtab = String(subtab?.name || "").trim().toLowerCase();
          if (targetSubtabName && currentSubtab !== targetSubtabName) return subtab;

          return {
            ...subtab,
            fields: (subtab.fields || []).map((field: any) => {
              const currentField = String(field?.fieldName || "").trim().toLowerCase();
              if (currentField !== targetFieldName) return field;
              return {
                ...field,
                ...updates,
                fieldName: updates?.fieldName || field?.fieldName,
              };
            }),
          };
        });
      }
      return merged;
    }

    if (incomingAction?.type === "delete_tab") {
      return null;
    }

    if (incomingAction?.type === "delete_subtab" && incomingAction?.delete) {
      const targetName = String(incomingAction.delete.subTabName || "").trim().toLowerCase();
      merged.subtabs = merged.subtabs.filter((subtab: any) => String(subtab?.name || "").trim().toLowerCase() !== targetName);
      return merged;
    }

    if (incomingAction?.type === "delete_field" && incomingAction?.delete) {
      const targetSubtab = String(incomingAction.delete.subTabName || "").trim().toLowerCase();
      const targetField = String(incomingAction.delete.fieldName || "").trim().toLowerCase();

      merged.subtabs = merged.subtabs.map((subtab: any) => {
        const currentSubtab = String(subtab?.name || "").trim().toLowerCase();
        if (targetSubtab && currentSubtab !== targetSubtab) return subtab;
        return {
          ...subtab,
          fields: (subtab.fields || []).filter(
            (field: any) => String(field?.fieldName || "").trim().toLowerCase() !== targetField
          ),
        };
      });
      return merged;
    }

    return merged;
  };

  const triggerSuggestion = async (kind: "subtab" | "field", label: string) => {
    const tabName = pendingAction?.tab?.name || currentPolicy?.tabs?.[0]?.name || "Current Policy";
    const targetSubtab = pendingAction?.subtabs?.[pendingAction.subtabs.length - 1]?.name;

    const prompt =
      kind === "subtab"
        ? `Add subtab ${label} under ${tabName}`
        : targetSubtab
          ? `Add field ${label} under ${tabName} > ${targetSubtab}`
          : `Add field ${label} in the most relevant existing section`;

    await sendMessage(prompt);
  };

  const buildDraftFromAction = (action: any) => {
    if (!action) return null;

    const policyMeta = currentPolicy?.policy || currentPolicy || {};

    const makeField = (field: any, idx: number) => ({
      id: String(field?.id || `field-${idx}`),
      fieldName: field?.fieldName || "Unnamed Field",
      operator: field?.operator || "=",
      thresholdValue: field?.thresholdValue ?? "",
      fieldValues: field?.fieldValues ?? "",
      documentNotes: field?.documentNotes || "",
      rules: field?.rules || "",
    });

    if (action.type === "create_nested_structure") {
      const groups = [
        { tab: action?.tab, subtabs: action?.subtabs || [] },
        ...((action?.additional_tabs || []).map((item: any) => ({ tab: item?.tab, subtabs: item?.subtabs || [] }))),
      ].filter((group: any) => group?.tab);

      const existingTabs = JSON.parse(JSON.stringify(Array.isArray(policyMeta?.tabs) ? policyMeta.tabs : []));

      const generatedTabs = groups.map((group: any, tabIdx: number) => ({
        id: String(group?.tab?.id || `draft-tab-${tabIdx}`),
        name: group?.tab?.name || `Generated Section ${tabIdx + 1}`,
        documentNotes: group?.tab?.documentNotes || "",
        subTabs: (group?.subtabs || []).map((subtab: any, subIdx: number) => ({
          id: String(subtab?.id || `subtab-${tabIdx}-${subIdx}`),
          name: subtab?.name || "Generated Group",
          documentNotes: subtab?.documentNotes || "",
          displayMode: subtab?.displayMode || "document",
          fields: (subtab?.fields || []).map((field: any, fieldIdx: number) => makeField(field, fieldIdx)),
        })),
      }));

      const mergedTabs = [...existingTabs];
      for (const genTab of generatedTabs) {
        const existingTab = mergedTabs.find(
          (tab: any) => String(tab?.name || "").trim().toLowerCase() === String(genTab?.name || "").trim().toLowerCase()
        );

        if (!existingTab) {
          mergedTabs.push(genTab);
          continue;
        }

        existingTab.documentNotes = genTab.documentNotes || existingTab.documentNotes;
        existingTab.subTabs = Array.isArray(existingTab.subTabs) ? existingTab.subTabs : [];

        for (const genSubtab of genTab.subTabs || []) {
          const existingSubtab = existingTab.subTabs.find(
            (sub: any) => String(sub?.name || "").trim().toLowerCase() === String(genSubtab?.name || "").trim().toLowerCase()
          );

          if (!existingSubtab) {
            existingTab.subTabs.push(genSubtab);
            continue;
          }

          existingSubtab.documentNotes = genSubtab.documentNotes || existingSubtab.documentNotes;
          existingSubtab.fields = Array.isArray(existingSubtab.fields) ? existingSubtab.fields : [];

          for (const genField of genSubtab.fields || []) {
            const existingField = existingSubtab.fields.find(
              (field: any) => String(field?.fieldName || "").trim().toLowerCase() === String(genField?.fieldName || "").trim().toLowerCase()
            );
            if (!existingField) {
              existingSubtab.fields.push(genField);
            }
          }
        }
      }

      return {
        name: policyMeta?.name || `Policy ${policyId}`,
        description: policyMeta?.description || "AI-generated draft preview.",
        product: policyMeta?.product || policyMeta?.productType || "GENERAL",
        version: policyMeta?.version || "v1.0",
        status: policyMeta?.status || "DRAFT",
        startDate: policyMeta?.startDate || policyMeta?.effectiveDate || policyMeta?.createdAt || new Date().toISOString(),
        tabs: mergedTabs,
      };
    }

    return null;
  };

  const currentPolicyMeta = currentPolicy?.policy || currentPolicy || {};
  const currentPolicyDraft = {
    name: currentPolicyMeta?.name || `Policy ${policyId}`,
    description: currentPolicyMeta?.description || "Start chatting to generate or update draft content.",
    product: currentPolicyMeta?.product || currentPolicyMeta?.productType || "GENERAL",
    version: currentPolicyMeta?.version || "v1.0",
    status: currentPolicyMeta?.status || "DRAFT",
    startDate: currentPolicyMeta?.startDate || currentPolicyMeta?.effectiveDate || currentPolicyMeta?.createdAt || new Date().toISOString(),
    tabs: Array.isArray(currentPolicyMeta?.tabs) ? currentPolicyMeta.tabs : [],
  };

  const applyPendingActionToDraft = (baseDraft: any, action: any) => {
    if (!action) return baseDraft;

    const draft = JSON.parse(JSON.stringify(baseDraft || {}));
    draft.tabs = Array.isArray(draft.tabs) ? draft.tabs : [];

    const findTab = (tabName?: string) =>
      draft.tabs.find((tab: any) => String(tab?.name || "").trim().toLowerCase() === String(tabName || "").trim().toLowerCase());

    if (action.type === "update_tab" && action.update) {
      const target = findTab(action.update.tabName);
      const updates = action.update.updates || {};
      if (target) {
        if (updates.name) target.name = updates.name;
        if (updates.documentNotes || updates.description) target.documentNotes = updates.documentNotes || updates.description;
      }
      return draft;
    }

    if (action.type === "update_subtab" && action.update) {
      const targetTab = findTab(action.update.tabName) || draft.tabs[0];
      const updates = action.update.updates || {};
      const subTabs = targetTab?.subTabs || [];
      const targetSubTab = subTabs.find(
        (subTab: any) => String(subTab?.name || "").trim().toLowerCase() === String(action.update.subTabName || "").trim().toLowerCase()
      );
      if (targetSubTab) {
        if (updates.name) targetSubTab.name = updates.name;
        if (updates.documentNotes || updates.description) {
          targetSubTab.documentNotes = updates.documentNotes || updates.description;
        }
        if (updates.displayMode) {
          targetSubTab.displayMode = updates.displayMode;
        }
      }
      return draft;
    }

    if (action.type === "update_field" && action.update) {
      const targetTab = findTab(action.update.tabName) || draft.tabs[0];
      const targetSubTab = (targetTab?.subTabs || []).find(
        (subTab: any) => String(subTab?.name || "").trim().toLowerCase() === String(action.update.subTabName || "").trim().toLowerCase()
      );
      const targetField = (targetSubTab?.fields || []).find(
        (field: any) => String(field?.fieldName || "").trim().toLowerCase() === String(action.update.fieldName || "").trim().toLowerCase()
      );
      const updates = action.update.updates || {};
      if (targetField) {
        Object.assign(targetField, updates);
      }
      return draft;
    }

    if (action.type === "update_fields" && Array.isArray(action.updates)) {
      for (const updateItem of action.updates) {
        const targetTab = findTab(updateItem.tabName) || draft.tabs[0];
        const targetSubTab = (targetTab?.subTabs || []).find(
          (subTab: any) => String(subTab?.name || "").trim().toLowerCase() === String(updateItem.subTabName || "").trim().toLowerCase()
        );
        const targetField = (targetSubTab?.fields || []).find(
          (field: any) => String(field?.fieldName || "").trim().toLowerCase() === String(updateItem.fieldName || "").trim().toLowerCase()
        );
        const updates = updateItem.updates || {};
        if (targetField) {
          Object.assign(targetField, updates);
        }
      }
      return draft;
    }

    return draft;
  };

  const actionDraft = buildDraftFromAction(pendingAction);
  const displayDraft = actionDraft || applyPendingActionToDraft(currentPolicyDraft, pendingAction);

  return (
    <>
      {/* Floating AI Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        title="AI Assistant"
      >
        <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="
            max-w-none!
            w-[95vw]
            h-[90vh]
            flex
            flex-col
            overflow-hidden
          "
        >
          <DialogHeader>
            <DialogTitle>AI Assistant</DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 gap-4 overflow-hidden">

            {/* Chat panel */}
            <div className="flex flex-col w-1/2 border rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Chat</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-xs"
                >
                  {showSuggestions ? 'Hide' : 'Show'} Suggestions
                </Button>
              </div>
              
              {showSuggestions && (
                <div className="mb-3 p-2 bg-blue-50 rounded border max-h-32 overflow-y-auto">
                  <h5 className="text-xs font-semibold mb-2">Suggestion History</h5>
                  {suggestionHistory.length > 0 ? (
                    <div className="space-y-2">
                      {suggestionHistory.map((item, i) => (
                        <div key={i} className="text-xs">
                          <div className="text-gray-500 mb-1">{item.timestamp}</div>
                          {item.suggestions.subtabs && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {item.suggestions.subtabs.map((s: string, j: number) => (
                                <Badge key={j} variant="secondary" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                          )}
                          {item.suggestions.fields && (
                            <div className="flex flex-wrap gap-1">
                              {item.suggestions.fields.map((s: string, j: number) => (
                                <Badge key={j} variant="outline" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No suggestions yet</div>
                  )}
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[calc(90vh-200px)]">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-bold">AI</span>
                          </div>
                          <span className="text-xs font-medium text-gray-600">Assistant</span>
                        </div>
                      )}
                      <div className={`text-sm ${msg.content === "Typing..." ? "italic text-gray-500" : ""}`}>
                        {msg.content}
                      </div>

                      {/* Citations */}
                      {msg.role === "ai" && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-xs text-gray-500 mr-1 flex items-center gap-1"><LinkIcon size={10}/> Referenced:</span>
                          {msg.citations.map((c, ci) => (
                            <span
                              key={ci}
                              title={c.type === "field" ? `${c.tabName} › ${c.subtabName}` : c.tabName || ""}
                              className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${
                                c.type === "tab" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
                                c.type === "subtab" ? "bg-violet-100 text-violet-700 hover:bg-violet-200" :
                                "bg-green-100 text-green-700 hover:bg-green-200"
                              }`}
                            >
                              {c.type === "tab" ? "§" : c.type === "subtab" ? "¶" : "#"} {c.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Inline Table */}
                      {msg.role === "ai" && msg.table_data && msg.table_data.length > 0 && (
                        <div className="mt-2 overflow-x-auto rounded border">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-700 text-white">
                                <th className="px-3 py-1.5 text-left font-semibold">Category</th>
                                <th className="px-3 py-1.5 text-left font-semibold">Value / Threshold</th>
                              </tr>
                            </thead>
                            <tbody>
                              {msg.table_data.map((row, ri) => (
                                <tr key={ri} className={ri % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                  <td className="px-3 py-1.5 font-medium text-gray-700">{row.category}</td>
                                  <td className="px-3 py-1.5 text-gray-600">{row.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {/* AI Suggestions */}
                      {msg.role === "ai" && msg.suggestions && (
                        <div className="mt-2 space-y-2">
                          {msg.suggestions?.subtabs && msg.suggestions.subtabs.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Would you also like me to create these subtabs?</p>
                              <div className="flex flex-wrap gap-1">
                                {msg.suggestions.subtabs.map((s: string, j: number) => (
                                  <button
                                    key={j}
                                    onClick={() => triggerSuggestion("subtab", s)}
                                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded cursor-pointer"
                                  >
                                    + {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {msg.suggestions?.fields && msg.suggestions.fields.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Would you also like me to create these fields?</p>
                              <div className="flex flex-wrap gap-1">
                                {msg.suggestions.fields.map((s: string, j: number) => (
                                  <button
                                    key={j}
                                    onClick={() => triggerSuggestion("field", s)}
                                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded cursor-pointer"
                                  >
                                    + {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-sm p-3 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-xs text-gray-500">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message... (e.g. 'Create income tab — salaried: 15lakh, self employed: 25lakh')"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !loading) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 min-h-15"
                  />
                  {/* File upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.csv,.json,.docx,.pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingFile(true);
                      setAttachedFile(file);
                      setUploadingFile(false);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile || loading}
                    title="Upload a document for AI context (.txt, .pdf, .docx, .csv)"
                    className="shrink-0 p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    {uploadingFile ? (
                      <span className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-gray-700 animate-spin inline-block" />
                    ) : (
                      <Paperclip size={16} />
                    )}
                  </button>
                  <Button onClick={() => sendMessage()} disabled={loading || (!input.trim() && !attachedFile)}>
                    {loading ? "Sending..." : "Send"}
                  </Button>
                </div>
                {attachedFile && (
                  <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700">
                    <span>Attached: {attachedFile.name}</span>
                    <button
                      type="button"
                      className="font-semibold hover:text-blue-900"
                      onClick={() => setAttachedFile(null)}
                    >
                      Remove
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  📎 Attach PDF/DOCX and hit Send to run extraction + Pinecone storage, then review/edit the generated draft and click Add to Policy to save in Prisma.
                </p>
              </div>
            </div>

            {/* Draft panel */}
            <div className="flex flex-col w-1/2 overflow-y-auto border rounded-lg p-3 bg-slate-50">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">AI Generated Draft</h4>
                <div className="flex items-center rounded-md border border-slate-300 bg-white p-0.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("document");
                      setIsViewModeOverridden(true);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[10px] font-semibold transition-colors ${
                      viewMode === "document"
                        ? "bg-slate-100 text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Document
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("table");
                      setIsViewModeOverridden(true);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[10px] font-semibold transition-colors ${
                      viewMode === "table"
                        ? "bg-slate-100 text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Table
                  </button>
                </div>
                {aiRepresentationHints && (
                  <div className="ml-2 flex items-center gap-2">
                    <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700">
                      AI: {aiRepresentationHints.suggestedDraftMode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsViewModeOverridden(false);
                        if (aiRepresentationHints.suggestedDraftMode === "table") {
                          setViewMode("table");
                        } else if (aiRepresentationHints.suggestedDraftMode === "document") {
                          setViewMode("document");
                        }
                      }}
                      className="rounded border border-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Reset to AI
                    </button>
                  </div>
                )}
              </div>

              {aiRepresentationHints?.reason ? (
                <div className="mb-3 rounded border border-blue-100 bg-blue-50 p-2 text-[11px] text-blue-800">
                  {aiRepresentationHints.reason}
                </div>
              ) : null}

              {pendingAction ? (
                <div className="space-y-4">
                  <div className="border border-amber-300 rounded-lg bg-amber-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white">
                          {pendingAction.type.replace("_", " ").toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">Draft Preview</span>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-white p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <h5 className="text-xs font-semibold text-gray-800">Draft Preview</h5>
                        <Table2 size={14} className="text-gray-500" />
                      </div>
                      <PolicyDraft data={displayDraft || currentPolicyDraft} className="p-3" viewMode={viewMode} />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await createPolicyItem(pendingAction);
                            setPendingAction(null);
                            setEditableAction(null);
                            onPolicyUpdate(pendingAction);
                          } catch (error: any) {
                            setDraftError(error?.message || "Failed to create item");
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check size={14} className="mr-1" /> Add to Policy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPendingAction(null);
                          setEditableAction(null);
                        }}
                      >
                        <X size={14} className="mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-white p-3">
                    <p className="mb-2 text-xs font-semibold text-gray-700">Current Draft Preview</p>
                    <PolicyDraft data={currentPolicyDraft} className="p-5" viewMode={viewMode} />
                  </div>
                  <div className="text-xs text-gray-500">
                    Ask AI to add, update, or delete sections. The preview will switch to pending AI changes automatically.
                  </div>
                </div>
              )}

              {draftError && (
                <p className="text-xs text-red-600 mt-3">
                  {draftError}
                </p>
              )}

              {suggestions && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    Suggestions
                  </p>

                  {suggestions.subtabs && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {suggestions.subtabs.map((s: string, i: number) => (
                        <Badge key={i}>{s}</Badge>
                      ))}
                    </div>
                  )}

                  {suggestions.fields && (
                    <div className="flex flex-wrap gap-1">
                      {suggestions.fields.map((s: string, i: number) => (
                        <Badge key={i}>{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
