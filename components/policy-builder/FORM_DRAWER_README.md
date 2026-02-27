# Form Drawer Components

This directory contains form drawer components built with shadcn/ui for managing policy fields, sub-tabs, and tabs.

## Components

### 1. FieldFormDrawer
A comprehensive form for creating and editing policy fields with validation rules.

**Features:**
- Field name and type selection
- Dynamic validation rules (min, max, pattern, etc.)
- Required field checkbox
- Document notes with rich text editor
- Operator and threshold configuration
- Weightage and order index
- Field values for dropdown options

**Usage:**
```tsx
import FieldFormDrawer from "@/components/policy-builder/FieldFormDrawer";

<FieldFormDrawer
  open={isOpen}
  onOpenChange={setIsOpen}
  onSubmit={handleSubmit}
  isPending={isPending}
  nextOrderIndex={1}
  editData={editData} // Optional: for edit mode
/>
```

### 2. SubTabFormDrawer
A form for creating and editing sub-categories (sub-tabs) within policy tabs.

**Features:**
- Sub-category name
- Order index
- Document notes with rich text editor

**Usage:**
```tsx
import SubTabFormDrawer from "@/components/policy-builder/SubTabFormDrawer";

<SubTabFormDrawer
  open={isOpen}
  onOpenChange={setIsOpen}
  onSubmit={handleSubmit}
  isPending={isPending}
  nextOrderIndex={1}
  editData={editData} // Optional: for edit mode
  policyId="policy-id"
/>
```

### 3. TabFormDrawer
A form for creating and editing main categories (tabs) in policies.

**Features:**
- Category name
- Order index
- Document notes with rich text editor

**Usage:**
```tsx
import TabFormDrawer from "@/components/policy-builder/TabFormDrawer";

<TabFormDrawer
  open={isOpen}
  onOpenChange={setIsOpen}
  onSubmit={handleSubmit}
  isPending={isPending}
  nextOrderIndex={1}
  editData={editData} // Optional: for edit mode
  policyId="policy-id"
/>
```

## Form Component (shadcn/ui)

The `form.tsx` component provides React Hook Form integration with shadcn/ui components.

**Components:**
- `Form` - Form provider wrapper
- `FormField` - Field controller
- `FormItem` - Field container
- `FormLabel` - Field label
- `FormControl` - Input wrapper
- `FormDescription` - Helper text
- `FormMessage` - Error message

## Implementation Details

### Validation
All forms use Zod for schema validation:
- Field names are required
- Order indices are numbers
- Document notes are optional

### State Management
Each form manages its own state using React Hook Form:
- Form values
- Validation errors
- Submission state

### Drawer Direction
All drawers open from the right side (`direction="right"`) for a consistent UX.

### Edit Mode
Pass `editData` prop to pre-populate the form for editing:
```tsx
const editData = {
  fieldName: "Annual Income",
  fieldType: "number",
  operator: ">=",
  thresholdValue: "50000",
  // ... other fields
};

<FieldFormDrawer editData={editData} ... />
```

## Integration Example

See `ExampleFormDrawerUsage.tsx` for a complete integration example showing:
- State management
- Opening drawers for create/edit
- Handling form submissions
- API integration patterns

## Dependencies

Required packages (already installed):
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Zod resolver
- `zod` - Schema validation
- `vaul` - Drawer primitive
- `@radix-ui/react-slot` - Slot component

## Migration from Old Modals

To migrate from the old modal components:

1. Replace `AddFieldModal` with `FieldFormDrawer`
2. Replace `AddSubTabModal` with `SubTabFormDrawer`
3. Replace `AddTabModal` with `TabFormDrawer`

**Before:**
```tsx
<AddFieldModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={handleSubmit}
  isPending={isPending}
  nextOrderIndex={1}
/>
```

**After:**
```tsx
<FieldFormDrawer
  open={isOpen}
  onOpenChange={setIsOpen}
  onSubmit={handleSubmit}
  isPending={isPending}
  nextOrderIndex={1}
/>
```

## Styling

All components use Tailwind CSS and follow the shadcn/ui design system:
- Consistent spacing and typography
- Accessible form controls
- Responsive layouts
- Smooth animations

## Accessibility

Forms include proper accessibility features:
- ARIA labels and descriptions
- Keyboard navigation
- Focus management
- Error announcements
