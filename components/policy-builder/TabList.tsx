"use client";

import { useState } from "react";
import { useCreateTab } from "@/hooks/useHierarchy";
import { Plus, Trash2, Edit2 } from "lucide-react";
import type { Tab } from "@/types";
import TabFormDrawer from "./TabFormDrawer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
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

interface TabListProps {
  tabs: Tab[];
  activeId: string | null;
  onSelect: (id: string) => void;
  policyId: string;
}

export default function TabList({ tabs, activeId, onSelect, policyId }: TabListProps) {
  const { mutate: createTab, isPending } = useCreateTab();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<Tab | null>(null);
  const [deleteTabId, setDeleteTabId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate: updateTab } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/tab/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabs", policyId] });
      toast.success("Tab updated!");
      setEditingTab(null);
    },
  });

  const { mutate: deleteTab } = useMutation({
    mutationFn: (id: string) => api.delete(`/tab/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabs", policyId] });
      toast.success("Tab deleted!");
    },
  });

  const handleAddTab = (data: { name: string; orderIndex: number }) => {
    if (editingTab) {
      updateTab({ id: editingTab.id, data });
    } else {
      createTab({ ...data, policyEngineId: policyId });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => (
          <div key={tab.id} className="relative group">
            <button
              onClick={() => onSelect(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeId === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.name}
            </button>
            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 flex gap-0.5 bg-white rounded-md shadow-lg border p-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTab(tab);
                  setIsModalOpen(true);
                }}
                className="p-1 hover:bg-blue-50 rounded text-blue-600"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTabId(tab.id);
                }}
                className="p-1 hover:bg-red-50 rounded text-red-600"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isPending}
          className="px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all text-sm flex items-center gap-1"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      <TabFormDrawer
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingTab(null);
        }}
        onSubmit={handleAddTab}
        isPending={isPending}
        nextOrderIndex={tabs.length + 1}
        editData={
          editingTab
            ? {
                name: editingTab.name,
                orderIndex: editingTab.orderIndex,
                documentNotes: editingTab.documentNotes ?? undefined,
              }
            : null
        }
        policyId={policyId}
      />

      <AlertDialog open={!!deleteTabId} onOpenChange={(open) => !open && setDeleteTabId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteTabId) deleteTab(deleteTabId);
              setDeleteTabId(null);
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
