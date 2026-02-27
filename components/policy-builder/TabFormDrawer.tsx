"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DocumentEditor from "./DocumentEditor";

const tabSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  orderIndex: z.number(),
  documentNotes: z.string().optional(),
});

type TabFormValues = z.infer<typeof tabSchema>;

interface TabFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TabFormValues) => void;
  isPending: boolean;
  nextOrderIndex: number;
  editData?: { name: string; orderIndex: number; documentNotes?: string } | null;
  policyId?: string;
}

export default function TabFormDrawer({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  nextOrderIndex,
  editData,
  policyId,
}: TabFormDrawerProps) {
  const form = useForm<TabFormValues>({
    resolver: zodResolver(tabSchema),
    defaultValues: {
      name: "",
      orderIndex: nextOrderIndex,
      documentNotes: "",
    },
  });

  useEffect(() => {
    if (editData) {
      form.reset({
        name: editData.name,
        orderIndex: editData.orderIndex,
        documentNotes: editData.documentNotes || "",
      });
    } else {
      form.reset({
        name: "",
        orderIndex: nextOrderIndex,
        documentNotes: "",
      });
    }
  }, [editData, nextOrderIndex, form]);

  const handleFormSubmit = (values: TabFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{editData ? "Edit Category" : "Add New Category"}</DialogTitle>
          <DialogDescription>
            {editData ? "Update category details" : "Create a new category for organizing policy rules"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 text-base">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Eligibility, Financials" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderIndex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Index</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Determines the display order of this category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Notes</FormLabel>
                    <FormControl>
                      <DocumentEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        policyId={policyId}
                        placeholder="Add documentation notes for this category..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex-shrink-0">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : editData ? "Update Category" : "Add Category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
