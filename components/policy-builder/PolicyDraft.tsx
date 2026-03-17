"use client";

import { useEffect, useMemo, useState } from "react";

interface DraftField {
  id: string;
  fieldName?: string;
  operator?: string | null;
  thresholdValue?: string | number | null;
  fieldValues?: string | number | null;
  documentNotes?: string | null;
  rules?: string | null;
  displayMode?: "document" | "table";
}

interface DraftSubSection {
  id: string;
  name: string;
  documentNotes?: string | null;
  fields?: DraftField[];
  subFields?: DraftField[];
  subfields?: DraftField[];
  displayMode?: "document" | "table";
}

interface DraftSection {
  id: string;
  name: string;
  documentNotes?: string | null;
  displayMode?: "document" | "table";
  subTabs?: DraftSubSection[];
  subtabs?: DraftSubSection[];
}

export interface PolicyDraftData {
  name?: string;
  product?: string;
  version?: string | number;
  status?: string;
  startDate?: string | Date | null;
  description?: string;
  tabs?: DraftSection[];
}

interface PolicyDraftProps {
  data: PolicyDraftData;
  className?: string;
  viewMode?: "document" | "table";
  editable?: boolean;
  onChangeData?: (updated: PolicyDraftData) => void;
  fitContainer?: boolean;
}

function formatDate(value?: string | Date | null): string {
  if (!value) return "N/A";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatValue(field: DraftField): string {
  const value = field.thresholdValue ?? field.fieldValues;
  if (value === null || value === undefined || String(value).trim() === "") return "N/A";
  return String(value);
}

function getNarrativeContent(field: DraftField): string {
  const preferred = [field.documentNotes, field.fieldValues, field.thresholdValue]
    .map((value) => String(value ?? "").trim())
    .find((value) => value.length > 0);
  return preferred || "";
}

function operatorToNatural(operator?: string | null, value?: string): string {
  void operator;
  const cleanValue = value && value.trim() ? value.trim() : "";
  return cleanValue;
}

function getSubSections(section: DraftSection): DraftSubSection[] {
  return section.subTabs || section.subtabs || [];
}

function getRules(subSection: DraftSubSection): DraftField[] {
  return subSection.fields || subSection.subFields || subSection.subfields || [];
}

function joinClassNames(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function makeId(prefix: string): string {
  try {
    return `${prefix}-${crypto.randomUUID()}`;
  } catch {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}

function normalizeDraft(data: PolicyDraftData): PolicyDraftData {
  const tabs = (data.tabs || []).map((tab, tabIndex) => ({
    ...tab,
    id: tab.id || makeId(`tab-${tabIndex}`),
    displayMode: tab.displayMode || undefined,
    subTabs: getSubSections(tab).map((subTab, subIndex) => ({
      ...subTab,
      id: subTab.id || makeId(`subtab-${tabIndex}-${subIndex}`),
      displayMode: subTab.displayMode || "document",
      fields: getRules(subTab).map((field, fieldIndex) => ({
        ...field,
        id: field.id || makeId(`field-${tabIndex}-${subIndex}-${fieldIndex}`),
        displayMode: field.displayMode || undefined,
      })),
    })),
  }));

  return {
    ...data,
    tabs,
  };
}

function PageFooter({ policyName, pageNumber }: { policyName?: string; pageNumber: number }) {
  return (
    <div className="absolute inset-x-0 bottom-3 px-6 text-[11px] text-slate-500">
      <div className="relative h-4">
        <div className="absolute left-1/2 -translate-x-1/2 font-semibold text-slate-600">
          {policyName || "Policy Draft"}
        </div>
        <div className="absolute right-0">Page {pageNumber}</div>
      </div>
    </div>
  );
}

export default function PolicyDraft({
  data,
  className,
  viewMode = "document",
  onChangeData,
  fitContainer = false,
}: PolicyDraftProps) {
  const [draft, setDraft] = useState<PolicyDraftData>(() => normalizeDraft(data));
  const isEditMode = false;
  const incomingDataKey = JSON.stringify(data || {});

  useEffect(() => {
    setDraft(normalizeDraft(data));
  }, [incomingDataKey]);

  const applyDraftUpdate = (updater: (prev: PolicyDraftData) => PolicyDraftData) => {
    setDraft((prev) => {
      const updated = normalizeDraft(updater(prev));
      onChangeData?.(updated);
      return updated;
    });
  };

  const sections = draft.tabs || [];

  const tocEntries = useMemo(() => {
    const entries: Array<{ label: string; page: number }> = [];
    sections.forEach((section, sectionIndex) => {
      const sectionPage = sectionIndex + 3;
      entries.push({ label: `${sectionIndex + 1}. ${section.name || "Major Policy Section"}`, page: sectionPage });
      const subSections = getSubSections(section);
      subSections.forEach((subSection, subIndex) => {
        entries.push({
          label: `${sectionIndex + 1}.${subIndex + 1} ${subSection.name || "Policy Sub-section"}`,
          page: sectionPage,
        });
      });
    });
    return entries;
  }, [sections]);

  return (
    <article
      className={joinClassNames(
        "relative mx-auto w-full rounded-sm border border-slate-300 bg-white p-6 text-slate-900 shadow-md print:shadow-none print:p-0",
        className
      )}
      style={{
        maxWidth: fitContainer ? "none" : "850px",
        fontFamily: "Cambria, Georgia, 'Times New Roman', serif",
      }}
    >
      <div className="space-y-6">
        <section className="relative min-h-[760px] border border-slate-200 p-6 pb-12">
          <div className="absolute right-6 top-6">
            {isEditMode ? (
              <input
                value={String(draft.status || "DRAFT")}
                onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, status: e.target.value }))}
                className="w-28 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-700"
              />
            ) : (
              <span className="rounded-full border border-slate-400 bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                {draft.status || "DRAFT"}
              </span>
            )}
          </div>

          <header className="mb-8 border-b-2 border-slate-700 pb-5 pr-28">
            {isEditMode ? (
              <>
                <input
                  value={draft.name || ""}
                  onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, name: e.target.value }))}
                  className="mb-2 w-full border-b border-slate-300 bg-transparent text-2xl font-bold leading-tight outline-none"
                  placeholder="Policy Name"
                />
                <textarea
                  value={draft.description || ""}
                  onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full resize-none rounded border border-slate-300 p-2 text-sm text-slate-700 outline-none"
                  rows={3}
                  placeholder="Policy description"
                />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold leading-tight">{draft.name || "Lending Policy"}</h1>
                <p className="mt-2 text-sm text-slate-700">{draft.description || "Comprehensive lending policy and assessment framework."}</p>
              </>
            )}
          </header>

          <section className="mb-8 break-inside-avoid">
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wide">Document Control</h2>
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr>
                  <td className="w-56 border border-slate-400 bg-slate-50 px-3 py-2 font-semibold">Policy Name</td>
                  <td className="border border-slate-400 px-3 py-2">
                    {isEditMode ? (
                      <input
                        value={draft.name || ""}
                        onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full border-none bg-transparent outline-none"
                      />
                    ) : (
                      draft.name || "N/A"
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 bg-slate-50 px-3 py-2 font-semibold">Product Code</td>
                  <td className="border border-slate-400 px-3 py-2">
                    {isEditMode ? (
                      <input
                        value={draft.product || ""}
                        onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, product: e.target.value }))}
                        className="w-full border-none bg-transparent outline-none"
                      />
                    ) : (
                      draft.product || "N/A"
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 bg-slate-50 px-3 py-2 font-semibold">Version</td>
                  <td className="border border-slate-400 px-3 py-2">
                    {isEditMode ? (
                      <input
                        value={String(draft.version || "")}
                        onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, version: e.target.value }))}
                        className="w-full border-none bg-transparent outline-none"
                      />
                    ) : (
                      draft.version || "N/A"
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 bg-slate-50 px-3 py-2 font-semibold">Effective Date</td>
                  <td className="border border-slate-400 px-3 py-2">
                    {isEditMode ? (
                      <input
                        type="date"
                        value={draft.startDate ? new Date(draft.startDate).toISOString().slice(0, 10) : ""}
                        onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="w-full border-none bg-transparent outline-none"
                      />
                    ) : (
                      formatDate(draft.startDate)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <PageFooter policyName={draft.name} pageNumber={1} />
        </section>

        <section className="relative min-h-[760px] border border-slate-200 p-6 pb-12">
          <h2 className="mb-4 text-lg font-semibold uppercase tracking-wide">Table of Contents</h2>
          {tocEntries.length === 0 ? (
            <p className="text-sm text-slate-600">No sections available for index.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {tocEntries.map((entry, idx) => (
                <div key={`${entry.label}-${idx}`} className="flex items-center gap-3">
                  <span className="truncate text-slate-800">{entry.label}</span>
                  <span className="flex-1 border-b border-dotted border-slate-300" />
                  <span className="font-semibold text-slate-700">{entry.page}</span>
                </div>
              ))}
            </div>
          )}
          <PageFooter policyName={draft.name} pageNumber={2} />
        </section>

        <section className="space-y-6">
          {sections.length === 0 ? (
            <div className="relative min-h-[760px] border border-slate-200 p-6 pb-12">
              <p className="text-sm text-slate-600">No policy sections are available yet.</p>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    applyDraftUpdate((prev) => ({
                      ...prev,
                      tabs: [
                        ...(prev.tabs || []),
                        { id: makeId("tab"), name: "New Section", documentNotes: "", subTabs: [] },
                      ],
                    }));
                  }}
                  className="mt-3 rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Add Section
                </button>
              )}
              <PageFooter policyName={draft.name} pageNumber={3} />
            </div>
          ) : (
            sections.map((section, sectionIndex) => {
              const subSections = getSubSections(section);
              const pageNumber = sectionIndex + 3;

              return (
                <div key={section.id || `${sectionIndex}`} className="relative min-h-[760px] border border-slate-200 p-6 pb-12">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    {isEditMode ? (
                      <div className="w-full space-y-2">
                        <input
                          value={section.name || ""}
                          onChange={(e) => {
                            applyDraftUpdate((prev) => ({
                              ...prev,
                              tabs: (prev.tabs || []).map((item, idx) =>
                                idx === sectionIndex ? { ...item, name: e.target.value } : item
                              ),
                            }));
                          }}
                          className="w-full border-b border-slate-300 bg-transparent text-[19px] font-semibold outline-none"
                          placeholder="Section title"
                        />
                        <select
                          value={section.displayMode || "document"}
                          onChange={(e) => {
                            const mode = e.target.value as "document" | "table";
                            applyDraftUpdate((prev) => ({
                              ...prev,
                              tabs: (prev.tabs || []).map((item, idx) =>
                                idx === sectionIndex ? { ...item, displayMode: mode } : item
                              ),
                            }));
                          }}
                          className="h-8 rounded border border-slate-300 px-2 text-xs"
                        >
                          <option value="document">Tab: Document View</option>
                          <option value="table">Tab: Table View</option>
                        </select>
                      </div>
                    ) : (
                      <h2 className="text-[19px] font-semibold">
                        {sectionIndex + 1}. {section.name || "Major Policy Section"}
                      </h2>
                    )}

                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => {
                          applyDraftUpdate((prev) => ({
                            ...prev,
                            tabs: (prev.tabs || []).filter((_, idx) => idx !== sectionIndex),
                          }));
                        }}
                        className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {isEditMode ? (
                    <textarea
                      value={section.documentNotes || ""}
                      onChange={(e) => {
                        applyDraftUpdate((prev) => ({
                          ...prev,
                          tabs: (prev.tabs || []).map((item, idx) =>
                            idx === sectionIndex ? { ...item, documentNotes: e.target.value } : item
                          ),
                        }));
                      }}
                      className="mb-4 w-full resize-none rounded border border-slate-300 p-2 text-sm leading-7 text-slate-700 outline-none"
                      rows={3}
                      placeholder="Section notes"
                    />
                  ) : section.documentNotes ? (
                    <p className="mb-4 text-sm leading-7 text-slate-700">{section.documentNotes}</p>
                  ) : null}

                  <div className="space-y-6">
                    {subSections.length === 0 ? (
                      <p className="text-sm text-slate-600">No policy sub-sections are available.</p>
                    ) : (
                      subSections.map((subSection, subIndex) => {
                        const rules = getRules(subSection);
                        const sectionDisplayMode = section.displayMode || viewMode || "document";
                        const subSectionDisplayMode = subSection.displayMode || sectionDisplayMode;
                        const tableRules = rules.filter(
                          (rule) => (rule.displayMode || subSectionDisplayMode) === "table"
                        );
                        const documentRules = rules.filter(
                          (rule) => (rule.displayMode || subSectionDisplayMode) !== "table"
                        );

                        return (
                          <div key={subSection.id || `${sectionIndex}-${subIndex}`} className="break-inside-avoid py-1">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              {isEditMode ? (
                                <div className="w-full space-y-2">
                                  <input
                                    value={subSection.name || ""}
                                    onChange={(e) => {
                                      applyDraftUpdate((prev) => ({
                                        ...prev,
                                        tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                          if (tabIdx !== sectionIndex) return tabItem;
                                          const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) =>
                                            currentSubIdx === subIndex ? { ...subItem, name: e.target.value } : subItem
                                          );
                                          return { ...tabItem, subTabs: updatedSubTabs };
                                        }),
                                      }));
                                    }}
                                    className="w-full border-b border-slate-300 bg-transparent text-base font-bold outline-none"
                                    placeholder="Sub-section title"
                                  />
                                  <select
                                    value={subSection.displayMode || "document"}
                                    onChange={(e) => {
                                      const mode = e.target.value as "document" | "table";
                                      applyDraftUpdate((prev) => ({
                                        ...prev,
                                        tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                          if (tabIdx !== sectionIndex) return tabItem;
                                          const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) =>
                                            currentSubIdx === subIndex ? { ...subItem, displayMode: mode } : subItem
                                          );
                                          return { ...tabItem, subTabs: updatedSubTabs };
                                        }),
                                      }));
                                    }}
                                    className="h-8 rounded border border-slate-300 px-2 text-xs"
                                  >
                                    <option value="document">Document View</option>
                                    <option value="table">Table View</option>
                                  </select>
                                </div>
                              ) : (
                                <h3 className="text-base font-bold underline decoration-slate-700 underline-offset-4">
                                  {sectionIndex + 1}.{subIndex + 1} {subSection.name || "Policy Sub-section"}
                                </h3>
                              )}

                              {isEditMode && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    applyDraftUpdate((prev) => ({
                                      ...prev,
                                      tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                        if (tabIdx !== sectionIndex) return tabItem;
                                        return {
                                          ...tabItem,
                                          subTabs: getSubSections(tabItem).filter((_, idx) => idx !== subIndex),
                                        };
                                      }),
                                    }));
                                  }}
                                  className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            {isEditMode ? (
                              <textarea
                                value={subSection.documentNotes || ""}
                                onChange={(e) => {
                                  applyDraftUpdate((prev) => ({
                                    ...prev,
                                    tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                      if (tabIdx !== sectionIndex) return tabItem;
                                      const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) =>
                                        currentSubIdx === subIndex ? { ...subItem, documentNotes: e.target.value } : subItem
                                      );
                                      return { ...tabItem, subTabs: updatedSubTabs };
                                    }),
                                  }));
                                }}
                                className="mb-3 w-full resize-none rounded border border-slate-300 p-2 text-sm leading-7 text-slate-700 outline-none"
                                rows={2}
                                placeholder="Sub-section notes"
                              />
                            ) : subSection.documentNotes ? (
                              <p className="mb-3 text-sm leading-7 text-slate-700">{subSection.documentNotes}</p>
                            ) : null}

                            {!isEditMode ? (
                              <div className="space-y-3">
                                {tableRules.length > 0 ? (
                                  <div className="overflow-hidden rounded-md border border-slate-300">
                                    <table className="w-full border-collapse text-left text-sm">
                                      <thead className="bg-slate-100">
                                        <tr>
                                          <th className="w-1/3 border-b border-slate-300 px-4 py-3 font-semibold text-slate-700">Criteria</th>
                                          <th className="w-1/3 border-b border-slate-300 px-4 py-3 font-semibold text-slate-700">Requirement</th>
                                          <th className="w-1/3 border-b border-slate-300 px-4 py-3 font-semibold text-slate-700">Notes</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {tableRules.map((rule, ruleIndex) => {
                                          const value = formatValue(rule);
                                          const condition = operatorToNatural(rule.operator, value);
                                          return (
                                            <tr key={rule.id || `${sectionIndex}-${subIndex}-${ruleIndex}`} className="transition-colors hover:bg-slate-50">
                                              <td className="border-r border-b border-slate-200 px-4 py-3 align-top font-medium text-slate-900">{rule.fieldName || "Unnamed Field"}</td>
                                              <td className="border-r border-b border-slate-200 px-4 py-3 align-top text-slate-800">{condition || "-"}</td>
                                              <td className="border-b border-slate-200 px-4 py-3 align-top italic leading-relaxed text-slate-600">{rule.documentNotes || "-"}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : null}

                                {documentRules.length > 0 ? (
                                  <div className="space-y-2">
                                    {documentRules.map((rule, ruleIndex) => {
                                      const narrative = getNarrativeContent(rule);
                                      return (
                                        <div key={rule.id || `${sectionIndex}-${subIndex}-doc-${ruleIndex}`} className="py-2 text-sm">
                                          <div>
                                            <span className="font-semibold">{rule.fieldName || "Criteria"}</span>
                                          </div>
                                          {narrative ? <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{narrative}</p> : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : null}

                                {tableRules.length === 0 && documentRules.length === 0 ? (
                                  <p className="text-sm text-slate-600">No criteria listed.</p>
                                ) : null}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {rules.length === 0 ? (
                                  <p className="text-sm text-slate-600">No criteria listed.</p>
                                ) : (
                                  rules.map((rule, ruleIndex) => {
                                    const value = formatValue(rule);
                                    const condition = operatorToNatural(rule.operator, value);
                                    return (
                                      <div key={rule.id || `${sectionIndex}-${subIndex}-${ruleIndex}`} className="rounded border border-slate-200 p-2 text-sm">
                                        {isEditMode ? (
                                          <div className="space-y-2">
                                            <div className="grid grid-cols-3 gap-2">
                                              <input
                                                value={rule.fieldName || ""}
                                                onChange={(e) => {
                                                  applyDraftUpdate((prev) => ({
                                                    ...prev,
                                                    tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                                      if (tabIdx !== sectionIndex) return tabItem;
                                                      const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                                        if (currentSubIdx !== subIndex) return subItem;
                                                        const updatedFields = getRules(subItem).map((fieldItem, currentFieldIdx) =>
                                                          currentFieldIdx === ruleIndex ? { ...fieldItem, fieldName: e.target.value } : fieldItem
                                                        );
                                                        return { ...subItem, fields: updatedFields };
                                                      });
                                                      return { ...tabItem, subTabs: updatedSubTabs };
                                                    }),
                                                  }));
                                                }}
                                                className="h-8 rounded border border-slate-300 px-2 text-xs"
                                                placeholder="Field"
                                              />
                                              <input
                                                value={String(rule.operator || "")}
                                                onChange={(e) => {
                                                  applyDraftUpdate((prev) => ({
                                                    ...prev,
                                                    tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                                      if (tabIdx !== sectionIndex) return tabItem;
                                                      const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                                        if (currentSubIdx !== subIndex) return subItem;
                                                        const updatedFields = getRules(subItem).map((fieldItem, currentFieldIdx) =>
                                                          currentFieldIdx === ruleIndex ? { ...fieldItem, operator: e.target.value } : fieldItem
                                                        );
                                                        return { ...subItem, fields: updatedFields };
                                                      });
                                                      return { ...tabItem, subTabs: updatedSubTabs };
                                                    }),
                                                  }));
                                                }}
                                                className="h-8 rounded border border-slate-300 px-2 text-xs"
                                                placeholder="Operator"
                                              />
                                              <input
                                                value={String(rule.thresholdValue ?? rule.fieldValues ?? "")}
                                                onChange={(e) => {
                                                  applyDraftUpdate((prev) => ({
                                                    ...prev,
                                                    tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                                      if (tabIdx !== sectionIndex) return tabItem;
                                                      const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                                        if (currentSubIdx !== subIndex) return subItem;
                                                        const updatedFields = getRules(subItem).map((fieldItem, currentFieldIdx) =>
                                                          currentFieldIdx === ruleIndex
                                                            ? { ...fieldItem, thresholdValue: e.target.value, fieldValues: e.target.value }
                                                            : fieldItem
                                                        );
                                                        return { ...subItem, fields: updatedFields };
                                                      });
                                                      return { ...tabItem, subTabs: updatedSubTabs };
                                                    }),
                                                  }));
                                                }}
                                                className="h-8 rounded border border-slate-300 px-2 text-xs"
                                                placeholder="Value"
                                              />
                                            </div>
                                            <textarea
                                              value={rule.documentNotes || ""}
                                              onChange={(e) => {
                                                applyDraftUpdate((prev) => ({
                                                  ...prev,
                                                  tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                                    if (tabIdx !== sectionIndex) return tabItem;
                                                    const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                                      if (currentSubIdx !== subIndex) return subItem;
                                                      const updatedFields = getRules(subItem).map((fieldItem, currentFieldIdx) =>
                                                        currentFieldIdx === ruleIndex ? { ...fieldItem, documentNotes: e.target.value } : fieldItem
                                                      );
                                                      return { ...subItem, fields: updatedFields };
                                                    });
                                                    return { ...tabItem, subTabs: updatedSubTabs };
                                                  }),
                                                }));
                                              }}
                                              className="w-full resize-none rounded border border-slate-300 p-2 text-xs outline-none"
                                              rows={2}
                                              placeholder="Rule notes"
                                            />
                                            <select
                                              value={rule.displayMode || "document"}
                                              onChange={(e) => {
                                                const mode = e.target.value as "document" | "table";
                                                applyDraftUpdate((prev) => ({
                                                  ...prev,
                                                  tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                                    if (tabIdx !== sectionIndex) return tabItem;
                                                    const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                                      if (currentSubIdx !== subIndex) return subItem;
                                                      const updatedFields = getRules(subItem).map((fieldItem, currentFieldIdx) =>
                                                        currentFieldIdx === ruleIndex ? { ...fieldItem, displayMode: mode } : fieldItem
                                                      );
                                                      return { ...subItem, fields: updatedFields };
                                                    });
                                                    return { ...tabItem, subTabs: updatedSubTabs };
                                                  }),
                                                }));
                                              }}
                                              className="h-8 rounded border border-slate-300 px-2 text-xs"
                                            >
                                              <option value="document">Field: Document View</option>
                                              <option value="table">Field: Table View</option>
                                            </select>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                applyDraftUpdate((prev) => ({
                                                  ...prev,
                                                  tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                                    if (tabIdx !== sectionIndex) return tabItem;
                                                    const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                                      if (currentSubIdx !== subIndex) return subItem;
                                                      return {
                                                        ...subItem,
                                                        fields: getRules(subItem).filter((_, idx) => idx !== ruleIndex),
                                                      };
                                                    });
                                                    return { ...tabItem, subTabs: updatedSubTabs };
                                                  }),
                                                }));
                                              }}
                                              className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                            >
                                              Remove Rule
                                            </button>
                                          </div>
                                        ) : (
                                          <>
                                            <div>
                                              <span className="font-semibold">{rule.fieldName || "Criteria"}</span>
                                              {condition ? (
                                                <>
                                                  <span className="mx-2 text-slate-400">-</span>
                                                  <span>{condition}</span>
                                                </>
                                              ) : null}
                                            </div>
                                            {rule.documentNotes && <p className="mt-1 text-sm text-slate-600 italic">{rule.documentNotes}</p>}
                                          </>
                                        )}
                                      </div>
                                    );
                                  })
                                )}

                                {isEditMode && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      applyDraftUpdate((prev) => ({
                                        ...prev,
                                        tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                          if (tabIdx !== sectionIndex) return tabItem;
                                          const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                            if (currentSubIdx !== subIndex) return subItem;
                                            return {
                                              ...subItem,
                                              fields: [
                                                ...getRules(subItem),
                                                {
                                                  id: makeId("field"),
                                                  fieldName: "New Rule",
                                                  operator: "==",
                                                  thresholdValue: "",
                                                  documentNotes: "",
                                                },
                                              ],
                                            };
                                          });
                                          return { ...tabItem, subTabs: updatedSubTabs };
                                        }),
                                      }));
                                    }}
                                    className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    Add Rule
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {isEditMode && (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          applyDraftUpdate((prev) => ({
                            ...prev,
                            tabs: (prev.tabs || []).map((item, idx) => {
                              if (idx !== sectionIndex) return item;
                              return {
                                ...item,
                                subTabs: [
                                  ...getSubSections(item),
                                  {
                                    id: makeId("subtab"),
                                    name: "New Sub-section",
                                    documentNotes: "",
                                    displayMode: "document",
                                    fields: [],
                                  },
                                ],
                              };
                            }),
                          }));
                        }}
                        className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Add Sub-section
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          applyDraftUpdate((prev) => ({
                            ...prev,
                            tabs: [
                              ...(prev.tabs || []),
                              { id: makeId("tab"), name: "New Section", documentNotes: "", subTabs: [] },
                            ],
                          }));
                        }}
                        className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Add Section
                      </button>
                    </div>
                  )}

                  <PageFooter policyName={draft.name} pageNumber={pageNumber} />
                </div>
              );
            })
          )}
        </section>
      </div>
    </article>
  );
}
