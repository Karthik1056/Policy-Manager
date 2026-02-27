"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import FieldFormDrawer from "@/components/policy-builder/FieldFormDrawer";
import SubTabFormDrawer from "@/components/policy-builder/SubTabFormDrawer";
import TabFormDrawer from "@/components/policy-builder/TabFormDrawer";

/**
 * Example usage of the form drawers
 * This demonstrates how to integrate the drawer forms into your components
 */
export default function ExampleUsage() {
  // Field Form State
  const [fieldDrawerOpen, setFieldDrawerOpen] = useState(false);
  const [fieldEditData, setFieldEditData] = useState<any>(null);
  const [fieldPending, setFieldPending] = useState(false);

  // SubTab Form State
  const [subTabDrawerOpen, setSubTabDrawerOpen] = useState(false);
  const [subTabEditData, setSubTabEditData] = useState<any>(null);
  const [subTabPending, setSubTabPending] = useState(false);

  // Tab Form State
  const [tabDrawerOpen, setTabDrawerOpen] = useState(false);
  const [tabEditData, setTabEditData] = useState<any>(null);
  const [tabPending, setTabPending] = useState(false);

  // Field Form Handlers
  const handleFieldSubmit = async (data: any) => {
    setFieldPending(true);
    try {
      // Your API call here
      console.log("Field data:", data);
      // await fetch('/api/field/create', { method: 'POST', body: JSON.stringify(data) });
      setFieldDrawerOpen(false);
      setFieldEditData(null);
    } catch (error) {
      console.error(error);
    } finally {
      setFieldPending(false);
    }
  };

  const openFieldDrawerForCreate = () => {
    setFieldEditData(null);
    setFieldDrawerOpen(true);
  };

  const openFieldDrawerForEdit = (field: any) => {
    setFieldEditData(field);
    setFieldDrawerOpen(true);
  };

  // SubTab Form Handlers
  const handleSubTabSubmit = async (data: any) => {
    setSubTabPending(true);
    try {
      console.log("SubTab data:", data);
      // await fetch('/api/subtab/create', { method: 'POST', body: JSON.stringify(data) });
      setSubTabDrawerOpen(false);
      setSubTabEditData(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSubTabPending(false);
    }
  };

  const openSubTabDrawerForCreate = () => {
    setSubTabEditData(null);
    setSubTabDrawerOpen(true);
  };

  const openSubTabDrawerForEdit = (subTab: any) => {
    setSubTabEditData(subTab);
    setSubTabDrawerOpen(true);
  };

  // Tab Form Handlers
  const handleTabSubmit = async (data: any) => {
    setTabPending(true);
    try {
      console.log("Tab data:", data);
      // await fetch('/api/tab/createTab', { method: 'POST', body: JSON.stringify(data) });
      setTabDrawerOpen(false);
      setTabEditData(null);
    } catch (error) {
      console.error(error);
    } finally {
      setTabPending(false);
    }
  };

  const openTabDrawerForCreate = () => {
    setTabEditData(null);
    setTabDrawerOpen(true);
  };

  const openTabDrawerForEdit = (tab: any) => {
    setTabEditData(tab);
    setTabDrawerOpen(true);
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Form Drawer Examples</h1>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Field Form</h2>
        <div className="flex gap-2">
          <Button onClick={openFieldDrawerForCreate}>Create Field</Button>
          <Button
            variant="outline"
            onClick={() =>
              openFieldDrawerForEdit({
                fieldName: "Annual Income",
                fieldType: "number",
                operator: ">=",
                thresholdValue: "50000",
                weightage: 10,
                orderIndex: 1,
                rules: JSON.stringify({
                  required: true,
                  validations: [{ type: "min", value: "0" }],
                }),
              })
            }
          >
            Edit Field Example
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">SubTab Form</h2>
        <div className="flex gap-2">
          <Button onClick={openSubTabDrawerForCreate}>Create Sub-Category</Button>
          <Button
            variant="outline"
            onClick={() =>
              openSubTabDrawerForEdit({
                name: "Income Rules",
                orderIndex: 1,
                documentNotes: "Rules related to income verification",
              })
            }
          >
            Edit Sub-Category Example
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Tab Form</h2>
        <div className="flex gap-2">
          <Button onClick={openTabDrawerForCreate}>Create Category</Button>
          <Button
            variant="outline"
            onClick={() =>
              openTabDrawerForEdit({
                name: "Eligibility",
                orderIndex: 1,
                documentNotes: "Eligibility criteria for loan approval",
              })
            }
          >
            Edit Category Example
          </Button>
        </div>
      </div>

      {/* Field Form Drawer */}
      <FieldFormDrawer
        open={fieldDrawerOpen}
        onOpenChange={setFieldDrawerOpen}
        onSubmit={handleFieldSubmit}
        isPending={fieldPending}
        nextOrderIndex={1}
        editData={fieldEditData}
      />

      {/* SubTab Form Drawer */}
      <SubTabFormDrawer
        open={subTabDrawerOpen}
        onOpenChange={setSubTabDrawerOpen}
        onSubmit={handleSubTabSubmit}
        isPending={subTabPending}
        nextOrderIndex={1}
        editData={subTabEditData}
        policyId="example-policy-id"
      />

      {/* Tab Form Drawer */}
      <TabFormDrawer
        open={tabDrawerOpen}
        onOpenChange={setTabDrawerOpen}
        onSubmit={handleTabSubmit}
        isPending={tabPending}
        nextOrderIndex={1}
        editData={tabEditData}
        policyId="example-policy-id"
      />
    </div>
  );
}
