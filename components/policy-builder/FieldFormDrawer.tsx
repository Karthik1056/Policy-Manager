"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Info } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import DocumentEditor from "./DocumentEditor";

const fieldSchema = z.object({
  fieldName: z.string().min(1, "Field name is required"),
  fieldType: z.string(),
  operator: z.string().optional(),
  thresholdValue: z.string().optional(),
  weightage: z.number().default(0),
  fieldValues: z.string().optional(),
  documentNotes: z.string().optional(),
  orderIndex: z.number(),
});

type FieldFormValues = z.infer<typeof fieldSchema>;

interface Rule {
  type: string;
  value: string;
}

interface FieldFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  nextOrderIndex: number;
  editData?: any;
}

export default function FieldFormDrawer({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  nextOrderIndex,
  editData,
}: FieldFormDrawerProps) {
  const [isRequired, setIsRequired] = useState(false);
  const [dynamicRules, setDynamicRules] = useState<Rule[]>([]);
  const [policyId, setPolicyId] = useState<string>("");

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      fieldName: "",
      fieldType: "text",
      operator: "",
      thresholdValue: "",
      weightage: 0,
      fieldValues: "",
      documentNotes: "",
      orderIndex: nextOrderIndex,
    },
  });

  useEffect(() => {
    const id = window.location.pathname.split('/').find((_, i, arr) => arr[i - 1] === 'policy');
    if (id) setPolicyId(id);

    if (editData) {
      form.reset({
        fieldName: editData.fieldName || "",
        fieldType: editData.fieldType || "text",
        operator: editData.operator || "",
        thresholdValue: editData.thresholdValue || "",
        weightage: editData.weightage || 0,
        fieldValues: editData.fieldValues || "",
        documentNotes: editData.documentNotes || "",
        orderIndex: editData.orderIndex || nextOrderIndex,
      });

      if (editData.rules) {
        try {
          const parsed = JSON.parse(editData.rules);
          setIsRequired(parsed.required || false);
          setDynamicRules(parsed.validations || []);
        } catch {
          setDynamicRules([]);
        }
      }
    } else {
      form.reset({
        fieldName: "",
        fieldType: "text",
        operator: "",
        thresholdValue: "",
        weightage: 0,
        fieldValues: "",
        documentNotes: "",
        orderIndex: nextOrderIndex,
      });
      setIsRequired(false);
      setDynamicRules([]);
    }
  }, [editData, nextOrderIndex, form]);

  const addRule = () => {
    setDynamicRules([...dynamicRules, { type: "min", value: "" }]);
  };

  const removeRule = (index: number) => {
    setDynamicRules(dynamicRules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof Rule, value: string) => {
    const updated = [...dynamicRules];
    updated[index][field] = value;
    setDynamicRules(updated);
  };

  const handleFormSubmit = (values: FieldFormValues) => {
    const rulesJson = {
      required: isRequired,
      validations: dynamicRules.filter((r) => r.type && r.value),
    };

    onSubmit({
      ...values,
      rules: JSON.stringify(rulesJson),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{editData ? "Edit Field" : "Add New Field"}</DialogTitle>
          <DialogDescription>
            {editData ? "Update field configuration" : "Create a new field with validation rules"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 text-base">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fieldName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter field name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fieldType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Field Rules</h3>
                  <Button type="button" onClick={addRule} size="sm">
                    <Plus size={16} className="mr-1" />
                    Add Rule
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={isRequired}
                    onCheckedChange={(checked) => setIsRequired(checked as boolean)}
                  />
                  <label htmlFor="required" className="text-sm font-medium">
                    Required Field
                  </label>
                </div>

                <div className="space-y-3">
                  {dynamicRules.map((rule, index) => (
                    <div key={index} className="flex gap-2 items-center bg-white p-3 rounded-md border">
                      <Select
                        value={rule.type}
                        onValueChange={(value) => updateRule(index, "type", value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="min">Min</SelectItem>
                          <SelectItem value="max">Max</SelectItem>
                          <SelectItem value="minLength">Min Length</SelectItem>
                          <SelectItem value="maxLength">Max Length</SelectItem>
                          <SelectItem value="pattern">Pattern</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={rule.value}
                        onChange={(e) => updateRule(index, "value", e.target.value)}
                        placeholder="Enter value"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRule(index)}
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </Button>
                    </div>
                  ))}
                  {dynamicRules.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">No validation rules added</p>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={18} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Document Notes</h3>
                </div>
                <FormField
                  control={form.control}
                  name="documentNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <DocumentEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          policyId={policyId}
                          placeholder="Add documentation notes for this field..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="operator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operator</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., >, <, ==, >=" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thresholdValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Threshold Value</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter threshold" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weightage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weightage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="fieldValues"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Values</FormLabel>
                    <FormControl>
                      <Input placeholder="Comma-separated values for dropdown" {...field} />
                    </FormControl>
                    <FormDescription>
                      For dropdown fields, enter comma-separated values
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex-shrink-0">
                <Button type="submit" disabled={isPending}>
                  {isPending ? (editData ? "Updating..." : "Adding...") : (editData ? "Update Field" : "Add Field")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
