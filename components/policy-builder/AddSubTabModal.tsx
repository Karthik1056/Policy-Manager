"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import DocumentEditor from "./DocumentEditor";

interface AddSubTabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; orderIndex: number; documentNotes?: string }) => void;
  isPending: boolean;
  nextOrderIndex: number;
  editData?: { name: string; orderIndex: number; documentNotes?: string } | null;
  policyId?: string;
}

export default function AddSubTabModal({ isOpen, onClose, onSubmit, isPending, nextOrderIndex, editData, policyId }: AddSubTabModalProps) {
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState(nextOrderIndex);
  const [documentNotes, setDocumentNotes] = useState("");

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setOrderIndex(editData.orderIndex);
      setDocumentNotes(editData.documentNotes || "");
    } else {
      setName("");
      setOrderIndex(nextOrderIndex);
      setDocumentNotes("");
    }
  }, [editData, nextOrderIndex]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), orderIndex, documentNotes: documentNotes.trim() || undefined });
      setName("");
      setOrderIndex(nextOrderIndex);
      setDocumentNotes("");
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 w-full border shadow-sm animate-fade-in-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">{editData ? "Edit Sub-Category" : "Add New Sub-Category"}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Sub-Category Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Income Rules, Credit Score"
            className="w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Order Index</label>
          <input
            type="number"
            value={orderIndex}
            onChange={(e) => setOrderIndex(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Document Notes</label>
          <DocumentEditor
            value={documentNotes}
            onChange={setDocumentNotes}
            policyId={policyId}
            placeholder="Add documentation notes for this rule group..."
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Saving..." : editData ? "Update Sub-Category" : "Add Sub-Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
