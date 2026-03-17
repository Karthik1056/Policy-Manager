"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { unwrapApiData } from "@/lib/unwrapApiData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCheckers } from "@/hooks/useCheckers";
import PolicyDraft from "@/components/policy-builder/PolicyDraft";
import { Eye, FilePlus2, LayoutTemplate, Paperclip, Sparkles, UploadCloud } from "lucide-react";
import {
  PREDEFINED_POLICY_TEMPLATES,
  buildDraftPreviewFromTemplate,
  getPolicyTemplateById,
  getPolicyTemplateStats,
} from "@/lib/policyTemplates";

type ExtractionTriple = {
  subject?: string;
  relation?: string;
  object?: string;
  chunk_index?: number;
  section?: string;
};

type ChunkPreview = {
  section?: string;
  preview?: string;
};

type NormalizedField = {
  fieldName?: string;
  fieldType?: string;
  operator?: string;
  thresholdValue?: string;
  fieldValues?: string;
  rules?: string;
  documentNotes?: string;
  orderIndex?: number;
  displayMode?: string;
};

type NormalizedSubtab = {
  name?: string;
  orderIndex?: number;
  documentNotes?: string;
  displayMode?: string;
  fields?: NormalizedField[];
};

type NormalizedTab = {
  name?: string;
  orderIndex?: number;
  documentNotes?: string;
  subtabs?: NormalizedSubtab[];
};

type SectionBucket = {
  sectionName: string;
  minChunk: number;
  triples: ExtractionTriple[];
};

type PolicyCreateResponse = {
  id: string;
};

export default function CreatePolicyPage() {
  const router = useRouter();
  const { data: checkers = [] } = useCheckers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    product: "",
    status: "DRAFT",
    version: "v1.0",
    description: "",
    checkerId: "",
  });

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("blank");
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const humanizeRelation = (relation?: string) => {
    const raw = String(relation || "").trim();
    if (!raw) return "Rule";
    return raw
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const toFieldType = (value?: string) => {
    const text = String(value || "").trim();
    if (!text) return "text";
    if (/^[-+]?\d+(?:\.\d+)?$/.test(text)) return "number";
    if (/\d/.test(text) && /(rs\.?|lakh|crore|%|month|year|score|age|tenure|tenor)/i.test(text)) return "number";
    return "text";
  };

  const normalizeSectionName = (section?: string, fallback = "General Rules") => {
    const name = String(section || "").trim();
    if (!name) return fallback;

    // Clean numeric-only headings like "5" / "6" to be more descriptive.
    const numericOnly = /^\d+(?:\.\d+)?$/.test(name);
    if (numericOnly) return `Section ${name}`;

    const normalized = name.replace(/^section\s+/i, "Section ");
    return normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized;
  };

  const inferOperator = (relation?: string) => {
    const rel = String(relation || "").toUpperCase();
    if (rel.includes("MAX")) return "<=";
    if (rel.includes("MIN")) return ">=";
    if (rel.includes("RANGE")) return "between";
    return "=";
  };

  const themeConfig = [
    { key: "overview", name: "Overview & Business Context", keywords: ["objective", "purpose", "business model", "segment", "partner", "model", "target"] },
    { key: "eligibility", name: "Eligibility & Applicant Profile", keywords: ["eligibility", "age", "cibil", "experience", "profile", "borrower", "applicant"] },
    { key: "loan-terms", name: "Loan Terms & Limits", keywords: ["loan amount", "tenure", "tenor", "facility", "term loan", "max loan", "min loan"] },
    { key: "pricing", name: "Pricing, Interest & Charges", keywords: ["interest", "rate", "fee", "charge", "penal", "pre closure", "processing", "%"] },
    { key: "documentation", name: "Documentation & KYC", keywords: ["document", "kyc", "proof", "registration", "itr", "statement", "ownership"] },
    { key: "repayment", name: "Repayment & Collections", keywords: ["repayment", "emi", "installment", "moratorium", "delinquency", "collection", "sanction"] },
    { key: "collateral", name: "Collateral & Security", keywords: ["collateral", "ltv", "mortgage", "security", "property", "lien"] },
  ] as const;

  const classifyTheme = (triple: ExtractionTriple) => {
    const text = `${triple.subject || ""} ${triple.relation || ""} ${triple.object || ""} ${triple.section || ""}`.toLowerCase();
    for (const theme of themeConfig) {
      if (theme.keywords.some((kw) => text.includes(kw))) {
        return theme.key;
      }
    }
    return "overview";
  };

  const seedPolicyStructureFromTriples = async (
    policyId: string,
    filename: string,
    triples: ExtractionTriple[],
    chunkPreview: ChunkPreview[] = [],
  ) => {
    const validTriples = (triples || []).filter(
      (t) => String(t?.subject || "").trim() && String(t?.relation || "").trim() && String(t?.object || "").trim()
    );

    const normalizedChunkPreview = (chunkPreview || [])
      .filter((chunk) => String(chunk?.preview || "").trim())
      .slice(0, 120);

    const fallbackTriplesFromChunks: ExtractionTriple[] =
      validTriples.length > 0
        ? []
        : normalizedChunkPreview.map((chunk, index) => ({
            subject: "Policy",
            relation: "CONTAINS_SECTION_CONTENT",
            object: String(chunk.preview || "").trim(),
            chunk_index: index,
            section: String(chunk.section || `Section ${index + 1}`).trim(),
          }));

    const sourceTriples = validTriples.length > 0 ? validTriples : fallbackTriplesFromChunks;

    if (sourceTriples.length === 0) return;

    // Keep write volume bounded for large docs.
    const cappedTriples = sourceTriples.slice(0, 500);

    // De-duplicate exact semantic triples so draft is less noisy.
    const dedupSet = new Set<string>();
    const dedupedTriples = cappedTriples.filter((t) => {
      const key = `${String(t.subject || "").trim().toLowerCase()}|${String(t.relation || "").trim().toLowerCase()}|${String(t.object || "").trim().toLowerCase()}`;
      if (dedupSet.has(key)) return false;
      dedupSet.add(key);
      return true;
    });

    // Group by thematic tab -> section subtab.
    const themeBuckets = new Map<string, Map<string, SectionBucket>>();
    for (const triple of dedupedTriples) {
      const theme = classifyTheme(triple);
      const sectionName = normalizeSectionName(triple.section, "General Rules");
      const chunk = Number.isFinite(Number(triple.chunk_index)) ? Number(triple.chunk_index) : 0;

      if (!themeBuckets.has(theme)) themeBuckets.set(theme, new Map());
      const sectionMap = themeBuckets.get(theme)!;

      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, {
          sectionName,
          minChunk: chunk,
          triples: [],
        });
      }

      const bucket = sectionMap.get(sectionName)!;
      bucket.minChunk = Math.min(bucket.minChunk, chunk);
      bucket.triples.push(triple);
    }

    let tabOrderIndex = 0;
    for (const theme of themeConfig) {
      const sectionMap = themeBuckets.get(theme.key);
      if (!sectionMap || sectionMap.size === 0) continue;

      const allThemeTriples = Array.from(sectionMap.values()).flatMap((b) => b.triples);

      const { data: tabRes } = await api.post("/tab/createTab", {
        name: theme.name,
        policyEngineId: policyId,
        orderIndex: tabOrderIndex,
        documentNotes: `Auto-generated from ${filename}. ${allThemeTriples.length} extracted rules grouped under ${sectionMap.size} sections.`,
      });
      tabOrderIndex += 1;

      const createdTab = unwrapApiData<any>(tabRes);
      const tabId = createdTab?.id;
      if (!tabId) {
        throw new Error(`Failed to create tab: ${theme.name}`);
      }

      const orderedSections = Array.from(sectionMap.values()).sort((a, b) => a.minChunk - b.minChunk);

      for (let subtabIndex = 0; subtabIndex < orderedSections.length; subtabIndex += 1) {
        const section = orderedSections[subtabIndex];

        const { data: subtabRes } = await api.post("/subtab/create", {
          name: section.sectionName,
          orderIndex: subtabIndex,
          documentNotes: `Extracted from ${filename}. ${section.triples.length} rules. Earliest source chunk: ${section.minChunk}.`,
          displayMode: "table",
          tabId,
        });

        const createdSubtab = unwrapApiData<any>(subtabRes);
        const subTabId = createdSubtab?.id;
        if (!subTabId) {
          throw new Error(`Failed to create subtab: ${section.sectionName}`);
        }

        const seenFieldNames = new Set<string>();
        for (let fieldIndex = 0; fieldIndex < section.triples.length; fieldIndex += 1) {
          const triple = section.triples[fieldIndex];
          const relationLabel = humanizeRelation(triple.relation);
          const subjectLabel = String(triple.subject || "").trim();

          const compactSubject = ["loan", "borrower", "applicant", "business", "collateral"].includes(subjectLabel.toLowerCase())
            ? subjectLabel
            : "Policy";

          const baseFieldName = `${compactSubject} - ${relationLabel}`;
          let fieldName = baseFieldName;
          let suffix = 2;
          while (seenFieldNames.has(fieldName.toLowerCase())) {
            fieldName = `${baseFieldName} ${suffix}`;
            suffix += 1;
          }
          seenFieldNames.add(fieldName.toLowerCase());

          await api.post("/field/create", {
            fieldName,
            fieldType: toFieldType(String(triple.object || "")),
            operator: inferOperator(triple.relation),
            thresholdValue: String(triple.object || "").slice(0, 500),
            rules: String(triple.relation || ""),
            documentNotes: `Source subject: ${subjectLabel || "N/A"}. Section: ${section.sectionName}. Chunk: ${Number(triple.chunk_index ?? 0)}.`,
            orderIndex: fieldIndex,
            subTabId,
          });
        }
      }
    }
  };

  const seedPolicyStructureFromNormalizedDraft = async (
    policyId: string,
    filename: string,
    tabs: NormalizedTab[],
  ) => {
    const validTabs = (tabs || []).filter((tab) => String(tab?.name || "").trim());
    if (validTabs.length === 0) return;

    for (let tabIndex = 0; tabIndex < validTabs.length; tabIndex += 1) {
      const tabDef = validTabs[tabIndex];
      const { data: tabRes } = await api.post("/tab/createTab", {
        name: String(tabDef.name || `Tab ${tabIndex + 1}`).trim(),
        policyEngineId: policyId,
        orderIndex: Number.isFinite(Number(tabDef.orderIndex)) ? Number(tabDef.orderIndex) : tabIndex,
        documentNotes: tabDef.documentNotes || `Normalized from extraction output for ${filename}`,
      });

      const createdTab = unwrapApiData<any>(tabRes);
      const tabId = createdTab?.id;
      if (!tabId) {
        throw new Error(`Failed to create normalized tab: ${String(tabDef.name || tabIndex + 1)}`);
      }

      const subtabs = Array.isArray(tabDef.subtabs) ? tabDef.subtabs : [];
      for (let subtabIndex = 0; subtabIndex < subtabs.length; subtabIndex += 1) {
        const subtabDef = subtabs[subtabIndex];
        const { data: subtabRes } = await api.post("/subtab/create", {
          name: String(subtabDef.name || `Section ${subtabIndex + 1}`).trim(),
          orderIndex: Number.isFinite(Number(subtabDef.orderIndex)) ? Number(subtabDef.orderIndex) : subtabIndex,
          documentNotes: subtabDef.documentNotes || `Normalized section from ${filename}`,
          displayMode: subtabDef.displayMode || "table",
          tabId,
        });

        const createdSubtab = unwrapApiData<any>(subtabRes);
        const subTabId = createdSubtab?.id;
        if (!subTabId) {
          throw new Error(`Failed to create normalized subtab: ${String(subtabDef.name || subtabIndex + 1)}`);
        }

        const fields = Array.isArray(subtabDef.fields) ? subtabDef.fields : [];
        for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex += 1) {
          const fieldDef = fields[fieldIndex];
          const fallbackName = `Rule ${fieldIndex + 1}`;

          await api.post("/field/create", {
            fieldName: String(fieldDef.fieldName || fallbackName).trim(),
            fieldType: fieldDef.fieldType || toFieldType(fieldDef.thresholdValue || fieldDef.fieldValues || ""),
            operator: fieldDef.operator || "=",
            thresholdValue: String(fieldDef.thresholdValue || "").slice(0, 500),
            fieldValues: String(fieldDef.fieldValues || "").slice(0, 500),
            rules: String(fieldDef.rules || "").slice(0, 250),
            documentNotes: fieldDef.documentNotes || `Normalized field from ${filename}`,
            orderIndex: Number.isFinite(Number(fieldDef.orderIndex)) ? Number(fieldDef.orderIndex) : fieldIndex,
            subTabId,
          });
        }
      }
    }
  };

  const seedPolicyStructureFromTemplate = async (policyId: string, templateId: string) => {
    const template = getPolicyTemplateById(templateId);
    if (!template) return;

    for (let tabIndex = 0; tabIndex < template.tabs.length; tabIndex += 1) {
      const tabDef = template.tabs[tabIndex];
      const { data: tabRes } = await api.post("/tab/createTab", {
        name: tabDef.name,
        policyEngineId: policyId,
        orderIndex: tabIndex,
        documentNotes: tabDef.documentNotes || `Seeded from template: ${template.name}`,
      });

      const createdTab = unwrapApiData<any>(tabRes);
      const tabId = createdTab?.id;
      if (!tabId) {
        throw new Error(`Failed to create template tab: ${tabDef.name}`);
      }

      for (let subtabIndex = 0; subtabIndex < tabDef.subtabs.length; subtabIndex += 1) {
        const subtabDef = tabDef.subtabs[subtabIndex];
        const { data: subtabRes } = await api.post("/subtab/create", {
          name: subtabDef.name,
          orderIndex: subtabIndex,
          documentNotes: subtabDef.documentNotes || `Template section from ${template.name}`,
          displayMode: subtabDef.displayMode || "document",
          tabId,
        });

        const createdSubtab = unwrapApiData<any>(subtabRes);
        const subTabId = createdSubtab?.id;
        if (!subTabId) {
          throw new Error(`Failed to create template subtab: ${subtabDef.name}`);
        }

        for (let fieldIndex = 0; fieldIndex < subtabDef.fields.length; fieldIndex += 1) {
          const fieldDef = subtabDef.fields[fieldIndex];
          await api.post("/field/create", {
            fieldName: fieldDef.fieldName,
            fieldType: fieldDef.fieldType,
            operator: fieldDef.operator || "=",
            thresholdValue: fieldDef.thresholdValue || "",
            fieldValues: fieldDef.fieldValues || "",
            rules: fieldDef.rules || "",
            documentNotes: fieldDef.documentNotes || `Template field from ${template.name}`,
            orderIndex: fieldIndex,
            subTabId,
          });
        }
      }
    }
  };

  const extractAndSeedPolicy = async (policyId: string) => {
    if (!attachedFile) return;

    setExtracting(true);
    const form = new FormData();
    form.append("file", attachedFile);
    form.append("llm_provider", "azure-foundry");
    form.append("async", "false");

    const { data } = await api.post(
      "http://localhost:8000/api/extraction/upload-policy",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    const result = data?.result || {};
    const normalizedTabs: NormalizedTab[] = Array.isArray(result?.frontend_ready?.draft_structure?.tabs)
      ? result.frontend_ready.draft_structure.tabs
      : [];

    if (normalizedTabs.length > 0) {
      await seedPolicyStructureFromNormalizedDraft(policyId, attachedFile.name, normalizedTabs);
      setExtracting(false);
      return;
    }

    const triples: ExtractionTriple[] = Array.isArray(result?.triples) ? result.triples : [];
    const chunkPreview: ChunkPreview[] = Array.isArray(result?.chunks_preview) ? result.chunks_preview : [];
    await seedPolicyStructureFromTriples(policyId, attachedFile.name, triples, chunkPreview);
    setExtracting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const loadingToast = toast.loading(attachedFile ? "Creating policy and importing file..." : "Creating policy...");
    try {
      let effectiveName = formData.name.trim();
      if (!effectiveName && attachedFile) {
        effectiveName = attachedFile.name.replace(/\.[^.]+$/, "");
      }

      if (!effectiveName) {
        toast.error("Policy name is required", { id: loadingToast });
        return;
      }

      const payload = {
        ...formData,
        name: effectiveName,
        product:
          formData.product ||
          getPolicyTemplateById(selectedTemplateId)?.product ||
          "GENERAL",
      };

      const { data } = await api.post("/policy/create", payload);
      const createdPolicy = unwrapApiData<PolicyCreateResponse>(data);

      if (attachedFile) {
        await extractAndSeedPolicy(createdPolicy.id);
      } else if (selectedTemplateId !== "blank") {
        await seedPolicyStructureFromTemplate(createdPolicy.id, selectedTemplateId);
      }

      toast.success(attachedFile ? "Policy created and draft imported!" : "Policy created!", { id: loadingToast });
      router.push(`/dashboard/maker/${createdPolicy.id}/build`);
    } catch (error: any) {
      const msg = String(error?.response?.data?.message || error?.message || "Failed to create policy");
      toast.error(msg, { id: loadingToast });
    } finally {
      setExtracting(false);
    }
  };

  const selectedTemplate = getPolicyTemplateById(selectedTemplateId);
  const previewTemplate = getPolicyTemplateById(previewTemplateId);

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Policy</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Start from a blank draft, upload an existing policy for extraction, or pick a predefined template like Word&apos;s new document gallery.
          </p>
        </div>
        <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <LayoutTemplate className="h-5 w-5 text-blue-600" />
            <span>{PREDEFINED_POLICY_TEMPLATES.length} predefined templates available</span>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Choose a Starting Point</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={() => setSelectedTemplateId("blank")}
            className={`rounded-2xl border p-5 text-left shadow-sm transition-all ${
              selectedTemplateId === "blank"
                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                <FilePlus2 className="h-5 w-5" />
              </div>
              {selectedTemplateId === "blank" && <Badge>Selected</Badge>}
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Blank Policy</h3>
            <p className="mt-2 text-sm text-slate-600">Start with an empty draft and build the full structure manually or with AI assistance later.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">Empty Draft</Badge>
              <Badge variant="secondary">Manual Build</Badge>
            </div>
          </button>

          {PREDEFINED_POLICY_TEMPLATES.map((template) => {
            const stats = getPolicyTemplateStats(template);
            const isSelected = selectedTemplateId === template.id;

            return (
              <div
                key={template.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-100"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className={`rounded-xl bg-linear-to-r ${template.accent} p-3 text-white shadow-sm`}>
                    <LayoutTemplate className="h-5 w-5" />
                  </div>
                  {isSelected && <Badge>Selected</Badge>}
                </div>

                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{template.category}</div>
                <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
                <p className="mt-2 min-h-10 text-sm text-slate-600">{template.summary}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-slate-50 px-2 py-2">
                    <div className="font-semibold text-slate-900">{stats.tabCount}</div>
                    <div className="text-slate-500">Tabs</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-2">
                    <div className="font-semibold text-slate-900">{stats.subtabCount}</div>
                    <div className="text-slate-500">Groups</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-2">
                    <div className="font-semibold text-slate-900">{stats.fieldCount}</div>
                    <div className="text-slate-500">Fields</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>

                <div className="mt-5 flex gap-2">
                  <Button
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      setAttachedFile(null);
                      setFormData((prev) => ({
                        ...prev,
                        product: prev.product || template.product,
                        description: prev.description || template.description,
                      }));
                    }}
                  >
                    Use Template
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setPreviewTemplateId(template.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedTemplate && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                <div className="font-semibold">Selected Template: {selectedTemplate.name}</div>
                <div className="mt-1 text-blue-800">{selectedTemplate.description}</div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Policy Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={attachedFile ? "Leave empty to use uploaded file name" : selectedTemplate ? `e.g. ${selectedTemplate.name} - North Region` : "Policy name"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Input
                id="product"
                type="text"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                placeholder={selectedTemplate ? selectedTemplate.product : "e.g., MSME, Personal Loan"}
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Existing Policy (Optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setAttachedFile(file);
                  if (file) {
                    setSelectedTemplateId("blank");
                  }
                  if (file && !formData.name.trim()) {
                    setFormData((prev) => ({
                      ...prev,
                      name: file.name.replace(/\.[^.]+$/, ""),
                    }));
                  }
                }}
              />
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    {attachedFile
                      ? `Attached: ${attachedFile.name}`
                      : "Attach a policy file to auto-generate tabs, subtabs, and fields from extraction. Attaching a file will switch off template selection."}
                  </div>
                  <div className="flex items-center gap-2">
                    {attachedFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAttachedFile(null)}
                      >
                        Remove
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {attachedFile ? <Paperclip className="mr-2 h-4 w-4" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                      {attachedFile ? "Change File" : "Attach File"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={selectedTemplate?.description || "Describe the purpose of this policy"}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="IN_REVIEW">IN_REVIEW</SelectItem>
                  <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                type="text"
                required
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="v1.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checker">Assign Checker (Optional)</Label>
              <Select value={formData.checkerId} onValueChange={(value) => setFormData({ ...formData, checkerId: value })}>
                <SelectTrigger id="checker">
                  <SelectValue placeholder="Select checker" />
                </SelectTrigger>
                <SelectContent>
                  {!Array.isArray(checkers) || checkers.length === 0 ? (
                    <SelectItem value="none" disabled>No checkers available</SelectItem>
                  ) : (
                    checkers.map((checker) => (
                      <SelectItem key={checker.id} value={checker.id}>
                        {checker.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={extracting}>
              {extracting
                ? "Analyzing File and Creating Policy..."
                : attachedFile
                  ? "Create Policy from Uploaded File"
                  : selectedTemplate
                    ? `Create Policy from ${selectedTemplate.name}`
                    : "Create Policy"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplateId(null)}>
        <DialogContent className="max-h-[90vh] w-[92vw] sm:max-w-300! overflow-hidden">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>{previewTemplate.name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="space-y-4 rounded-xl border bg-slate-50 p-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</div>
                    <div className="mt-1 font-medium text-slate-900">{previewTemplate.category}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product</div>
                    <div className="mt-1 font-medium text-slate-900">{previewTemplate.product}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</div>
                    <div className="mt-1 text-sm text-slate-700">{previewTemplate.description}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {(() => {
                      const stats = getPolicyTemplateStats(previewTemplate);
                      return (
                        <>
                          <div className="rounded-lg bg-white px-2 py-2 shadow-sm">
                            <div className="font-semibold text-slate-900">{stats.tabCount}</div>
                            <div className="text-slate-500">Tabs</div>
                          </div>
                          <div className="rounded-lg bg-white px-2 py-2 shadow-sm">
                            <div className="font-semibold text-slate-900">{stats.subtabCount}</div>
                            <div className="text-slate-500">Groups</div>
                          </div>
                          <div className="rounded-lg bg-white px-2 py-2 shadow-sm">
                            <div className="font-semibold text-slate-900">{stats.fieldCount}</div>
                            <div className="text-slate-500">Fields</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      setSelectedTemplateId(previewTemplate.id);
                      setAttachedFile(null);
                      setPreviewTemplateId(null);
                      setFormData((prev) => ({
                        ...prev,
                        product: prev.product || previewTemplate.product,
                        description: prev.description || previewTemplate.description,
                      }));
                    }}
                  >
                    Use This Template
                  </Button>
                </div>
                <div className="max-h-[72vh] overflow-y-auto overflow-x-hidden rounded-xl border bg-white p-2">
                  <PolicyDraft
                    data={buildDraftPreviewFromTemplate(previewTemplate)}
                    className="border-none shadow-none"
                    fitContainer
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
