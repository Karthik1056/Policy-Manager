import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import asyncHandler from "@/utils/AsyncHandlerService";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export const generateAIPolicyDocument = asyncHandler(async (policyId: string) => {
  const policy = await prisma.policyEngine.findUnique({
    where: { id: policyId },
    include: {
      maker: { select: { name: true, email: true } },
      tabs: {
        orderBy: { orderIndex: 'asc' },
        include: {
          subTabs: {
            orderBy: { orderIndex: 'asc' },
            include: { fields: { orderBy: { orderIndex: 'asc' } } }
          }
        }
      }
    }
  });

  if (!policy) throw new ApiError(404, "Policy not found");

  const content = generatePolicyContent(policy);

  const sections = [
    new Paragraph({
      text: policy.name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Product: ", bold: true, font: "Times New Roman", size: 24 }),
        new TextRun({ text: policy.product, font: "Times New Roman", size: 24 })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Version: ", bold: true, font: "Times New Roman", size: 24 }),
        new TextRun({ text: policy.version, font: "Times New Roman", size: 24 })
      ],
      spacing: { after: 400 }
    }),
    ...parseContentToParagraphs(content)
  ];

  const doc = new Document({
    sections: [{ properties: {}, children: sections }]
  });

  return await Packer.toBuffer(doc);
});

function generatePolicyContent(policy: any): string {
  let content = `CORPORATE POLICY DOCUMENT\n\nPolicy Name: ${policy.name}\nProduct Category: ${policy.product}\nVersion: ${policy.version}\nEffective Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;

  policy.tabs.forEach((tab: any, tabIdx: number) => {
    const sectionNum = tabIdx + 1;

    content += `${sectionNum}. ${tab.name}\n`;
    content += `Policy Rationale: ${tab.documentNotes || `This section outlines the ${tab.name.toLowerCase()} requirements in strict accordance with regulatory guidelines and internal risk management frameworks. These criteria are designed to ensure comprehensive evaluation while maintaining compliance with applicable standards.`}\n\n`;

    content += `Additional Context: This ${tab.name} section contains ${tab.subTabs.length} subsection${tab.subTabs.length > 1 ? 's' : ''} that collectively establish a comprehensive framework for evaluating applicants. The rules defined here serve as primary gatekeepers in the approval process, ensuring that only qualified candidates who meet baseline requirements proceed to subsequent evaluation stages. Each criterion has been carefully calibrated to balance business growth objectives with prudent risk management, reflecting both regulatory mandates and institutional risk appetite.\n\n`;

    tab.subTabs.forEach((subTab: any, subIdx: number) => {
      content += `${sectionNum}.${subIdx + 1} ${subTab.name}\n`;
      content += `${subTab.documentNotes || `To comply with ${subTab.name.toLowerCase()} standards and internal risk limits, the following criteria apply:`}\n\n`;

      content += `Implementation Note: The ${subTab.name} subsection defines ${subTab.fields.length} specific parameter${subTab.fields.length > 1 ? 's' : ''} that must be evaluated. These parameters work in conjunction to create a multi-dimensional assessment model. The system interprets these rules as mandatory checkpoints that filter applications based on quantifiable metrics, ensuring consistency in decision-making while reducing subjective bias. This automated evaluation approach enhances processing efficiency and maintains audit trail integrity for regulatory compliance.\n\n`;

      subTab.fields.forEach((field: any) => {
        content += `\n${field.fieldName}:\n`;

        if (field.operator && field.thresholdValue) {
          const operatorText = field.operator === '>=' ? 'at least' : field.operator === '<=' ? 'no more than' : field.operator === '>' ? 'greater than' : field.operator === '<' ? 'less than' : field.operator === '==' ? 'exactly' : field.operator;

          content += `Requirement: The applicant must have ${field.fieldName} ${operatorText} ${field.thresholdValue}.\n`;
          content += `Technical Condition: ${field.fieldName} ${field.operator} ${field.thresholdValue}\n\n`;

          if (field.documentNotes) {
            content += `Rationale: ${field.documentNotes}\n\n`;
          } else {
            content += `Rationale: This threshold is set to ensure the applicant meets the minimum eligibility criteria for this product tier.\n\n`;
          }

          content += `Enforcement: This requirement is mandatory and non-negotiable. Applications failing to meet this criterion will be automatically rejected or routed for manual underwriting review based on the severity of the deviation.\n\n`;
          content += `Technical Interpretation: The system understands this as a hard boundary condition where ${field.fieldName} serves as a quantitative risk indicator. Values ${field.operator} ${field.thresholdValue} signal acceptable risk levels, while deviations indicate elevated risk requiring human judgment. This binary decision point enables rapid automated processing for qualifying applications while ensuring appropriate escalation for edge cases.\n`;
        } else if (field.fieldValues) {
          content += `Requirement: Approval is strictly limited to applicants with ${field.fieldName} matching one of the following verified statuses: ${field.fieldValues}.\n\n`;

          if (field.documentNotes) {
            content += `Rationale: ${field.documentNotes}\n\n`;
          } else {
            content += `Rationale: This ensures proper legal compliance and risk categorization.\n\n`;
          }

          content += `Enforcement: Applications with values outside this defined set fall outside the automated approval scope and require separate offline processing.\n\n`;
          content += `Technical Interpretation: This represents a categorical constraint where ${field.fieldName} must match predefined acceptable values. The system treats this as an enumeration check, instantly validating against the whitelist. Non-matching values trigger exception handling workflows, as they may indicate data quality issues or applicant profiles requiring specialized assessment.\n`;
        } else if (field.rules) {
          content += `Rule: ${field.rules}\n\n`;

          if (field.documentNotes) {
            content += `Rationale: ${field.documentNotes}\n\n`;
          } else {
            content += `Rationale: This rule is implemented to filter out high-risk profiles and ensure sustained financial stability.\n\n`;
          }

          content += `Enforcement: Compliance with this requirement is verified through automated system checks against bureau data and internal records.\n\n`;
          content += `Technical Interpretation: The system interprets this as a complex business rule that may involve multiple data points or conditional logic. This rule encapsulates domain expertise and historical performance patterns, translating institutional knowledge into executable decision criteria that the automated engine can consistently apply across all applications.\n`;
        } else if (field.documentNotes) {
          content += `Description: ${field.documentNotes}\n\n`;
          content += `Evaluation: This field is evaluated as part of the comprehensive risk assessment to determine final approval status.\n\n`;
          content += `Technical Interpretation: This parameter contributes to the holistic applicant profile. While specific thresholds aren't defined, the system captures and validates this data point, potentially using it in aggregate scoring models or as a tiebreaker in borderline cases. The field's presence indicates its relevance to the overall risk evaluation framework.\n`;
        } else {
          content += `Description: This ${field.fieldType} field is captured and evaluated as part of the holistic assessment process.\n\n`;
          content += `Validation: The system validates this information against internal databases and external bureau records to ensure accuracy and completeness before proceeding with the approval decision.\n\n`;
          content += `Technical Interpretation: As a ${field.fieldType} data point, this field undergoes type validation and format checking. The system treats it as a required input that contributes to the complete applicant profile, even if explicit decision rules aren't specified. Its inclusion suggests potential use in downstream analytics, reporting, or future model enhancements.\n`;
        }
      });

      content += `\n`;
    });
  });

  return content;
}

function parseContentToParagraphs(content: string): Paragraph[] {
  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: "", spacing: { after: 200 } }));
      continue;
    }

    if (line.trim().toUpperCase() === line.trim() && line.length < 50) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line.trim(), bold: true, font: "Times New Roman", size: 32 })],
        spacing: { before: 400, after: 200 }
      }));
    } else if (line.match(/^\d+\./)) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, bold: true, font: "Times New Roman", size: 32 })],
        spacing: { before: 400, after: 200 }
      }));
    } else if (line.match(/^\d+\.\d+/)) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, bold: true, font: "Times New Roman", size: 28 })],
        spacing: { before: 300, after: 200 }
      }));
    } else {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, font: "Times New Roman", size: 24 })],
        spacing: { after: 150 }
      }));
    }
  }

  return paragraphs;
}
