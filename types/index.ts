export type UserRole = 'MAKER' | 'CHECKER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface PolicyField {
  id: string;
  fieldName: string;
  fieldType: string;
  operator?: string | null;
  thresholdValue?: string | null;
  rules?: string | null;
  documentNotes?: string | null;
}

export interface SubTab {
  id: string;
  name: string;
  orderIndex: number;
  documentNotes?: string | null;
  displayMode?: "document" | "table" | null;
  fields?: PolicyField[];
}

export interface Tab {
  id: string;
  name: string;
  orderIndex: number;
  documentNotes?: string | null;
  subTabs?: SubTab[];
}

export interface Policy {
  id: string;
  name: string;
  product: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED';
  version: string;
  description?: string | null;
  tabs?: Tab[];
}
