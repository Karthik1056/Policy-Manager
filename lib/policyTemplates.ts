export type PolicyTemplateField = {
  fieldName: string;
  fieldType: "text" | "number";
  operator?: string;
  thresholdValue?: string;
  fieldValues?: string;
  rules?: string;
  documentNotes?: string;
};

export type PolicyTemplateSubTab = {
  name: string;
  displayMode?: "document" | "table";
  documentNotes?: string;
  fields: PolicyTemplateField[];
};

export type PolicyTemplateTab = {
  name: string;
  documentNotes?: string;
  subtabs: PolicyTemplateSubTab[];
};

export type PolicyStructureTemplate = {
  id: string;
  name: string;
  category: string;
  product: string;
  description: string;
  summary: string;
  accent: string;
  tags: string[];
  tabs: PolicyTemplateTab[];
};

export const PREDEFINED_POLICY_TEMPLATES: PolicyStructureTemplate[] = [
  {
    id: "personal-loan-standard",
    name: "Personal Loan Standard",
    category: "Retail Lending",
    product: "PERSONAL_LOAN",
    description: "Retail unsecured lending template with eligibility, bureau filters, income rules, pricing, and approval notes.",
    summary: "Best for salaried and self-employed unsecured retail programs.",
    accent: "from-sky-500 to-blue-700",
    tags: ["Retail", "Unsecured", "Quick Start"],
    tabs: [
      {
        name: "Applicant Eligibility",
        documentNotes: "Core customer and bureau screening for personal loan onboarding.",
        subtabs: [
          {
            name: "Basic Eligibility",
            displayMode: "table",
            fields: [
              { fieldName: "Age", fieldType: "number", operator: "between", thresholdValue: "21-60", documentNotes: "Applicant age at loan origination." },
              { fieldName: "Employment Type", fieldType: "text", fieldValues: "Salaried/Self-Employed", documentNotes: "Allowed applicant profiles." },
              { fieldName: "Bureau Score", fieldType: "number", operator: ">=", thresholdValue: "720", documentNotes: "Minimum bureau score for straight-through approval." },
            ],
          },
          {
            name: "Income Assessment",
            displayMode: "table",
            fields: [
              { fieldName: "Net Monthly Income", fieldType: "number", operator: ">=", thresholdValue: "25000", documentNotes: "Minimum monthly income requirement." },
              { fieldName: "FOIR", fieldType: "number", operator: "<=", thresholdValue: "55", rules: "Percent", documentNotes: "Fixed obligations to income ratio threshold." },
            ],
          },
        ],
      },
      {
        name: "Program Terms",
        documentNotes: "Facility, pricing, and exceptions for the approved customer segment.",
        subtabs: [
          {
            name: "Loan Parameters",
            displayMode: "table",
            fields: [
              { fieldName: "Loan Amount", fieldType: "number", operator: "between", thresholdValue: "50000-2000000", documentNotes: "Permitted sanction range." },
              { fieldName: "Tenure", fieldType: "number", operator: "between", thresholdValue: "12-60", rules: "Months" },
              { fieldName: "Processing Fee", fieldType: "number", operator: "<=", thresholdValue: "3", rules: "Percent" },
            ],
          },
          {
            name: "Policy Notes",
            displayMode: "document",
            fields: [
              { fieldName: "Deviation Handling", fieldType: "text", fieldValues: "Any deviations must be escalated to credit approver with justification and supporting documents." },
              { fieldName: "Disbursal Conditions", fieldType: "text", fieldValues: "Disbursal only after KYC, mandate setup, and final fraud checks are completed." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "msme-working-capital",
    name: "MSME Working Capital",
    category: "Business Lending",
    product: "MSME_WORKING_CAPITAL",
    description: "Business underwriting template with borrower profile, vintage, turnover, banking, collateral, and monitoring sections.",
    summary: "Useful for SME cash-credit, OD, and working-capital style programs.",
    accent: "from-emerald-500 to-teal-700",
    tags: ["MSME", "Business", "Secured/Unsecured"],
    tabs: [
      {
        name: "Business Eligibility",
        subtabs: [
          {
            name: "Borrower Profile",
            displayMode: "document",
            fields: [
              { fieldName: "Business Vintage", fieldType: "text", fieldValues: "Operating vintage should generally be at least 24 months for standard processing.", documentNotes: "Vintage may be relaxed only under approved exception matrix." },
              { fieldName: "Entity Type", fieldType: "text", fieldValues: "Allowed forms include Proprietorship, Partnership, Private Limited, and LLP entities." },
              { fieldName: "Promoter Bureau Score", fieldType: "text", fieldValues: "Promoter bureau profile is expected at or above benchmark score of 700." },
            ],
          },
          {
            name: "Financial Assessment",
            displayMode: "table",
            fields: [
              { fieldName: "Annual Turnover", fieldType: "number", operator: ">=", thresholdValue: "5000000" },
              { fieldName: "Banking Vintage", fieldType: "number", operator: ">=", thresholdValue: "12", rules: "Months" },
              { fieldName: "DSCR", fieldType: "number", operator: ">=", thresholdValue: "1.2" },
            ],
          },
        ],
      },
      {
        name: "Facility Structure",
        subtabs: [
          {
            name: "Exposure Norms",
            displayMode: "table",
            fields: [
              { fieldName: "Minimum Limit", fieldType: "number", operator: ">=", thresholdValue: "100000" },
              { fieldName: "Maximum Limit", fieldType: "number", operator: "<=", thresholdValue: "5000000" },
              { fieldName: "Tenor", fieldType: "number", operator: "<=", thresholdValue: "36", rules: "Months" },
            ],
          },
          {
            name: "Monitoring Notes",
            displayMode: "document",
            fields: [
              { fieldName: "Renewal Review", fieldType: "text", fieldValues: "Renewal subject to latest banking, GST/financial review, and conduct validation." },
              { fieldName: "Covenant Breach", fieldType: "text", fieldValues: "Any material covenant breach requires immediate review and freeze of further utilization." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "home-loan-core",
    name: "Home Loan Core",
    category: "Retail Lending",
    product: "HOME_LOAN",
    description: "Housing finance template covering customer, property, LTV, repayment, legal, and technical checks.",
    summary: "Structured base template for retail housing and LAP-style secured lending.",
    accent: "from-amber-400 to-orange-600",
    tags: ["Retail", "Secured", "Property"],
    tabs: [
      {
        name: "Customer & Property",
        subtabs: [
          {
            name: "Customer Eligibility",
            displayMode: "document",
            fields: [
              { fieldName: "Age Band", fieldType: "text", fieldValues: "Typical borrower age band is 23 years at entry and not above 70 years at maturity." },
              { fieldName: "Credit Bureau Expectation", fieldType: "text", fieldValues: "Target bureau benchmark is 730 or better for clean underwriting flow." },
              { fieldName: "Income Stability", fieldType: "text", fieldValues: "Income and repayment capacity must be evidenced with stable and verifiable records." },
            ],
          },
          {
            name: "Property Validation",
            displayMode: "table",
            fields: [
              { fieldName: "Property Type", fieldType: "text", fieldValues: "Residential Self-Occupied/Residential Investment" },
              { fieldName: "Legal Clear Title", fieldType: "text", fieldValues: "Mandatory" },
              { fieldName: "Technical Valuation", fieldType: "text", fieldValues: "Mandatory before sanction" },
            ],
          },
        ],
      },
      {
        name: "Limits & Repayment",
        subtabs: [
          {
            name: "Exposure Limits",
            displayMode: "table",
            fields: [
              { fieldName: "LTV", fieldType: "number", operator: "<=", thresholdValue: "80", rules: "Percent" },
              { fieldName: "EMI/NMI", fieldType: "number", operator: "<=", thresholdValue: "50", rules: "Percent" },
              { fieldName: "Tenure", fieldType: "number", operator: "<=", thresholdValue: "360", rules: "Months" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "gold-loan-fast-track",
    name: "Gold Loan Fast Track",
    category: "Retail Lending",
    product: "GOLD_LOAN",
    description: "Fast-track secured gold loan template with appraisal, purity, LTV, storage, and auction norms.",
    summary: "Useful for short-tenor gold-backed programs with branch appraisal workflows.",
    accent: "from-yellow-400 to-amber-700",
    tags: ["Gold", "Fast Track", "Collateral"],
    tabs: [
      {
        name: "Appraisal & Eligibility",
        subtabs: [
          {
            name: "Gold Quality",
            displayMode: "document",
            fields: [
              { fieldName: "Purity Standard", fieldType: "text", fieldValues: "Accepted pledged jewellery should generally meet purity threshold of 18 carat or above." },
              { fieldName: "Accepted Articles", fieldType: "text", fieldValues: "Only jewellery items are accepted unless policy-approved exception applies." },
              { fieldName: "KYC Precondition", fieldType: "text", fieldValues: "Customer KYC verification is mandatory before appraisal acceptance." },
            ],
          },
        ],
      },
      {
        name: "Exposure & Security",
        subtabs: [
          {
            name: "Facility Rules",
            displayMode: "table",
            fields: [
              { fieldName: "LTV", fieldType: "number", operator: "<=", thresholdValue: "75", rules: "Percent" },
              { fieldName: "Tenor", fieldType: "number", operator: "<=", thresholdValue: "12", rules: "Months" },
              { fieldName: "Auction Trigger", fieldType: "number", operator: ">=", thresholdValue: "90", rules: "DPD" },
            ],
          },
          {
            name: "Vault & Control Notes",
            displayMode: "document",
            fields: [
              { fieldName: "Storage Control", fieldType: "text", fieldValues: "Articles must be stored in approved branch vault with maker-checker logging." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "vehicle-loan-standard",
    name: "Vehicle Loan Standard",
    category: "Retail Lending",
    product: "VEHICLE_LOAN",
    description: "Vehicle finance template for retail/commercial asset funding with dealer, customer, LTV, and insurance controls.",
    summary: "Good base template for passenger and light commercial vehicle programs.",
    accent: "from-slate-500 to-gray-800",
    tags: ["Vehicle", "Asset Finance", "Dealer"],
    tabs: [
      {
        name: "Customer & Dealer",
        subtabs: [
          {
            name: "Borrower Rules",
            displayMode: "document",
            fields: [
              { fieldName: "Net Income", fieldType: "text", fieldValues: "Net monthly income is expected to be around 20,000 or above for standard retail programs." },
              { fieldName: "Bureau Score", fieldType: "text", fieldValues: "Preferred bureau score benchmark is 700 and above." },
              { fieldName: "Repayment Track", fieldType: "text", fieldValues: "No severe delinquencies in last 12 months" },
            ],
          },
          {
            name: "Dealer Controls",
            displayMode: "document",
            fields: [
              { fieldName: "Approved Dealer", fieldType: "text", fieldValues: "Disbursal only to empaneled dealers." },
              { fieldName: "Invoice Validation", fieldType: "text", fieldValues: "Mandatory before final payout." },
            ],
          },
        ],
      },
      {
        name: "Asset Funding Rules",
        subtabs: [
          {
            name: "Exposure Norms",
            displayMode: "table",
            fields: [
              { fieldName: "LTV", fieldType: "number", operator: "<=", thresholdValue: "90", rules: "Percent" },
              { fieldName: "Tenure", fieldType: "number", operator: "<=", thresholdValue: "84", rules: "Months" },
              { fieldName: "Insurance Coverage", fieldType: "text", fieldValues: "Comprehensive insurance mandatory" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "hospitality-lending",
    name: "Hospitality Lending",
    category: "Sector Templates",
    product: "HOSPITALITY_LENDING",
    description: "Sector-specific template for hotels, resorts, and hospitality operators with occupancy and seasonality considerations.",
    summary: "Designed for hospitality borrowers with revenue seasonality and asset-backed review.",
    accent: "from-fuchsia-500 to-pink-700",
    tags: ["Hospitality", "Sector", "Structured"],
    tabs: [
      {
        name: "Borrower & Asset Context",
        subtabs: [
          {
            name: "Business Profile",
            displayMode: "document",
            fields: [
              { fieldName: "Operating Vintage", fieldType: "text", fieldValues: "Business is generally expected to demonstrate around 36 months of operating history." },
              { fieldName: "Average Occupancy", fieldType: "text", fieldValues: "Sustainable occupancy expectation is approximately 55% or above on annualized basis." },
              { fieldName: "Property Category", fieldType: "text", fieldValues: "Hotel/Resort/Serviced Apartment/Banquet" },
            ],
          },
          {
            name: "Seasonality Commentary",
            displayMode: "document",
            fields: [
              { fieldName: "Seasonality Assessment", fieldType: "text", fieldValues: "Credit memo must explain seasonal revenue patterns, peak months, and off-season mitigation." },
            ],
          },
        ],
      },
      {
        name: "Financial & Security Review",
        subtabs: [
          {
            name: "Cash Flow Controls",
            displayMode: "table",
            fields: [
              { fieldName: "DSCR", fieldType: "number", operator: ">=", thresholdValue: "1.25" },
              { fieldName: "EBITDA Margin", fieldType: "number", operator: ">=", thresholdValue: "18", rules: "Percent" },
              { fieldName: "LTV", fieldType: "number", operator: "<=", thresholdValue: "70", rules: "Percent" },
            ],
          },
        ],
      },
    ],
  },
];

export const getPolicyTemplateById = (id?: string | null) => {
  return PREDEFINED_POLICY_TEMPLATES.find((template) => template.id === id) || null;
};

export const getPolicyTemplateStats = (template: PolicyStructureTemplate) => {
  const tabCount = template.tabs.length;
  const subtabCount = template.tabs.reduce((count, tab) => count + tab.subtabs.length, 0);
  const fieldCount = template.tabs.reduce(
    (count, tab) => count + tab.subtabs.reduce((subCount, subtab) => subCount + subtab.fields.length, 0),
    0
  );

  return { tabCount, subtabCount, fieldCount };
};

export const buildDraftPreviewFromTemplate = (template: PolicyStructureTemplate) => ({
  name: template.name,
  product: template.product,
  status: "DRAFT",
  version: "v1.0",
  description: template.description,
  tabs: template.tabs.map((tab, tabIndex) => ({
    id: `template-tab-${tabIndex}`,
    name: tab.name,
    documentNotes: tab.documentNotes,
    subTabs: tab.subtabs.map((subtab, subtabIndex) => ({
      id: `template-subtab-${tabIndex}-${subtabIndex}`,
      name: subtab.name,
      documentNotes: subtab.documentNotes,
      displayMode: subtab.displayMode || "document",
      fields: subtab.fields.map((field, fieldIndex) => ({
        id: `template-field-${tabIndex}-${subtabIndex}-${fieldIndex}`,
        fieldName: field.fieldName,
        operator: field.operator,
        thresholdValue: field.thresholdValue,
        fieldValues: field.fieldValues,
        documentNotes: field.documentNotes,
        rules: field.rules,
      })),
    })),
  })),
});