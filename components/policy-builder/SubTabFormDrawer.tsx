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

const subTabSchema = z.object({
  name: z.string().min(1, "Sub-category name is required"),
  orderIndex: z.number(),
  documentNotes: z.string().optional(),
});

type SubTabFormValues = z.infer<typeof subTabSchema>;

interface SubTabFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SubTabFormValues) => void;
  isPending: boolean;
  nextOrderIndex: number;
  editData?: { name: string; orderIndex: number; documentNotes?: string } | null;
  policyId?: string;
}

export default function SubTabFormDrawer({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  nextOrderIndex,
  editData,
  policyId,
}: SubTabFormDrawerProps) {
  const form = useForm<SubTabFormValues>({
    resolver: zodResolver(subTabSchema),
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

  const handleFormSubmit = (values: SubTabFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{editData ? "Edit Sub-Category" : "Add New Sub-Category"}</DialogTitle>
          <DialogDescription>
            {editData ? "Update sub-category details" : "Create a new sub-category for organizing fields"}
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
                    <FormLabel>Sub-Category Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Income Rules, Credit Score" {...field} />
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
                      Determines the display order of this sub-category
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
                        placeholder="Add documentation notes for this rule group..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex-shrink-0">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : editData ? "Update Sub-Category" : "Add Sub-Category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
