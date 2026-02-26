# Database Migration Instructions

## Add documentNotes to Tab and SubTab Tables

After updating the Prisma schema, run the following commands to apply the changes:

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_document_notes_to_tab_and_subtab
```

## SQL Migration (if needed manually)

```sql
-- Add documentNotes column to Tab table
ALTER TABLE "Tab" ADD COLUMN "documentNotes" TEXT;

-- Add documentNotes column to SubTab table
ALTER TABLE "SubTab" ADD COLUMN "documentNotes" TEXT;
```

## Changes Made

1. **Schema (prisma/schema.prisma)**
   - Added `documentNotes String?` to Tab model
   - Added `documentNotes String?` to SubTab model

2. **Interfaces (interface/interface.ts)**
   - Added `documentNotes?: string | null` to TabInterface
   - Added `documentNotes?: string | null` to subTabInterface

3. **Types (types/index.ts)**
   - Added `documentNotes?: string | null` to Tab type
   - Added `documentNotes?: string | null` to SubTab type

4. **Components**
   - Updated AddTabModal.tsx to include documentNotes field
   - Updated AddSubTabModal.tsx to include documentNotes field
   - Updated SubTabSection.tsx to display documentNotes

5. **Controllers**
   - No changes needed - controllers already handle dynamic fields through filteredData
