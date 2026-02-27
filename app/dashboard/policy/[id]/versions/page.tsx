"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Printer, Code } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PolicyVersionsPage() {
  const params = useParams();
  const router = useRouter();
  const policyId = String(params?.id ?? "");
  const [policy, setPolicy] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [baseVersion, setBaseVersion] = useState<any>(null);
  const [compareVersion, setCompareVersion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diff, setDiff] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/policy/${policyId}`).then(r => r.json()),
      fetch(`/api/policy/version/${policyId}`).then(r => r.json()),
    ]).then(([policyRes, versionsRes]) => {
      setPolicy(policyRes.data);
      const scopedVersions = (versionsRes.data || []).filter(
        (v: any) => v?.policyEngineId === policyId
      );
      setVersions(scopedVersions);
      setLoading(false);
    });
  }, [policyId]);

  useEffect(() => {
    if (baseVersion && compareVersion) {
      const baseData = baseVersion.snapshotData;
      const compareData = compareVersion === "current" ? policy : compareVersion.snapshotData;
      generateDiff(baseData, compareData);
    } else if (baseVersion && compareVersion === "current") {
      generateDiff(baseVersion.snapshotData, policy);
    }
  }, [baseVersion, compareVersion, policy]);

  const generateDiff = (base: any, compare: any) => {
    const diffLines: any[] = [];

    const baseFields = extractFields(base);
    const compareFields = extractFields(compare);

    const allFieldKeys = new Set([...Object.keys(baseFields), ...Object.keys(compareFields)]);

    allFieldKeys.forEach(key => {
      const baseField = baseFields[key];
      const compareField = compareFields[key];

      if (!compareField) {
        diffLines.push({ type: "removed", content: formatField(baseField) });
      } else if (!baseField) {
        diffLines.push({ type: "added", content: formatField(compareField) });
      } else {
        const baseStr = JSON.stringify({ name: baseField.fieldName, op: baseField.operator, val: baseField.thresholdValue });
        const compareStr = JSON.stringify({ name: compareField.fieldName, op: compareField.operator, val: compareField.thresholdValue });
        
        if (baseStr !== compareStr) {
          diffLines.push({ type: "removed", content: formatField(baseField) });
          diffLines.push({ type: "added", content: formatField(compareField) });
        }
      }
    });

    setDiff(diffLines);
  };

  const extractFields = (data: any) => {
    const fields: any = {};
    data?.tabs?.forEach((tab: any) => {
      tab?.subTabs?.forEach((subTab: any) => {
        subTab?.fields?.forEach((field: any) => {
          const key = `${field.fieldName}_${field.operator}_${field.thresholdValue}`;
          fields[key] = field;
        });
      });
    });
    return fields;
  };

  const formatField = (field: any) => {
    return `${field.fieldName} ${field.operator || "="} ${field.thresholdValue || field.fieldValues || ""}`;
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <div className="text-sm text-gray-500 mb-1">
              Policies / {policy?.product} / Policy #{policy?.id?.slice(0, 8)}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{policy?.name} v{policy?.version}</h1>
          </div>
          <Button variant="outline" size="sm">
            <Printer size={16} className="mr-2" />
            Print Summary
          </Button>
          <Button variant="outline" size="sm">
            <Code size={16} className="mr-2" />
            View JSON
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Badge variant={
            policy?.status === "IN_REVIEW" ? "outline" :
            policy?.status === "PUBLISHED" ? "default" :
            "secondary"
          }>
            {policy?.status === "IN_REVIEW" ? "Pending Review" : policy?.status}
          </Badge>
          <span>Last modified by {policy?.maker?.name}</span>
          <span>Updated {new Date(policy?.updatedAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">BASE VERSION (ACTIVE)</label>
            <select
              value={baseVersion?.id || ""}
              onChange={(e) => setBaseVersion(versions.find(v => v.id === e.target.value))}
              disabled={versions.length === 0}
              className="w-full px-4 py-3 border rounded-lg text-sm text-gray-900"
            >
              <option value="">
                {versions.length === 0 ? "No versions available" : "Select base version"}
              </option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber} - Published {new Date(v.createdAt).toLocaleDateString()}
                  {v.changeNote && ` - ${v.changeNote.substring(0, 50)}${v.changeNote.length > 50 ? '...' : ''}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-600 mb-2">COMPARE VERSION (PROPOSED)</label>
            <select
              value={compareVersion === "current" ? "current" : compareVersion?.id || ""}
              onChange={(e) => setCompareVersion(e.target.value === "current" ? "current" : versions.find(v => v.id === e.target.value))}
              disabled={versions.length === 0}
              className="w-full px-4 py-3 border-2 border-blue-500 rounded-lg text-sm text-gray-900"
            >
              <option value="">
                {versions.length === 0 ? "No versions available" : "Select compare version"}
              </option>
              <option value="current">v{policy?.version} - Draft (Current)</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber} - {new Date(v.createdAt).toLocaleDateString()}
                  {v.changeNote && ` - ${v.changeNote.substring(0, 50)}${v.changeNote.length > 50 ? '...' : ''}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {versions.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No versions available for this policy</p>
          </div>
        ) : diff.length > 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} />
              <h2 className="text-lg font-semibold">Policy Rules Comparison</h2>
              <div className="ml-auto flex gap-4 text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-100 rounded"></span>
                  Removed
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-100 rounded"></span>
                  Added
                </span>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">LN</TableHead>
                    <TableHead>CONTENT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diff.map((item, idx) => (
                    <TableRow key={idx} className={`${
                      item.type === "removed" ? "bg-red-50" :
                      item.type === "added" ? "bg-green-50" :
                      ""
                    }`}>
                      <TableCell className="text-gray-900 font-mono">
                        {item.type === "removed" ? "-" : item.type === "added" ? "+" : idx + 1}
                      </TableCell>
                      <TableCell className={`pl-12 font-mono ${
                        item.type === "removed" ? "text-red-700" :
                        item.type === "added" ? "text-green-700" :
                        "text-gray-900"
                      }`}>
                        {item.content}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center">
              End of file. {diff.filter(d => d.type === "added").length} additions, {diff.filter(d => d.type === "removed").length} deletions.
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Select both base and compare versions to see differences</p>
          </div>
        )}
      </div>
    </div>
  );
}
