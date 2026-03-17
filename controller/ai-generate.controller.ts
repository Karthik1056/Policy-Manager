import { ApiError } from "@/utils/ApiError";
import asyncHandler from "@/utils/AsyncHandlerService";
import axios from "axios";

export const generatePolicyStructure = asyncHandler(async (prompt: string) => {
    const structuredPrompt = `You are a policy structure generator. Based on the user's description, generate a JSON structure for a policy with tabs, subtabs, and fields.

User Request: ${prompt}

Generate a JSON response with this exact structure:
{
  "tabs": [
    {
      "name": "Tab Name",
      "documentNotes": "Description of this tab section",
      "subTabs": [
        {
          "name": "SubTab Name",
          "documentNotes": "Description of this subsection",
          "fields": [
            {
              "fieldName": "fieldName",
              "fieldType": "number|string|boolean|date",
              "operator": ">=|<=|>|<|==",
              "thresholdValue": "value",
              "documentNotes": "Why this field exists"
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Create logical tabs for major policy sections (e.g., Demographics, Financial, Credit)
- Create subtabs for specific criteria groups
- For each field, include operator and threshold if it's a validation rule
- Use descriptive documentNotes explaining the business rationale
- Return ONLY valid JSON, no markdown or extra text`;

    try {
        // Try OpenAI if available
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (apiKey) {
            const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: structuredPrompt }],
                    temperature: 0.7,
                    max_tokens: 2000
                },
                { headers: { "Authorization": `Bearer ${apiKey}` } }
            );

            const content = response.data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        }
        
        // Fallback: Generate basic structure from keywords
        return generateFallbackStructure(prompt);
    } catch (error) {
        console.error("AI generation failed:", error);
        return generateFallbackStructure(prompt);
    }
});

function generateFallbackStructure(prompt: string): any {
    const lowerPrompt = prompt.toLowerCase();
    const tabs = [];
    
    // Demographics tab
    if (lowerPrompt.includes('age') || lowerPrompt.includes('demographic') || lowerPrompt.includes('citizen')) {
        tabs.push({
            name: "Applicant Demographics",
            documentNotes: "Basic demographic and eligibility requirements",
            subTabs: [
                {
                    name: "Age Requirements",
                    documentNotes: "Age-based eligibility criteria",
                    fields: [
                        {
                            fieldName: "applicantAge",
                            fieldType: "number",
                            operator: ">=",
                            thresholdValue: "21",
                            documentNotes: "Minimum age requirement for independent qualification"
                        }
                    ]
                }
            ]
        });
    }
    
    // Financial tab
    if (lowerPrompt.includes('income') || lowerPrompt.includes('financial') || lowerPrompt.includes('salary')) {
        tabs.push({
            name: "Financial Assessment",
            documentNotes: "Income and financial stability verification",
            subTabs: [
                {
                    name: "Income Verification",
                    documentNotes: "Minimum income requirements",
                    fields: [
                        {
                            fieldName: "annualIncome",
                            fieldType: "number",
                            operator: ">=",
                            thresholdValue: "500000",
                            documentNotes: "Minimum annual income threshold"
                        }
                    ]
                }
            ]
        });
    }
    
    // Credit tab
    if (lowerPrompt.includes('credit') || lowerPrompt.includes('cibil') || lowerPrompt.includes('score')) {
        tabs.push({
            name: "Credit Assessment",
            documentNotes: "Credit history and score requirements",
            subTabs: [
                {
                    name: "Credit Score",
                    documentNotes: "Minimum credit score requirements",
                    fields: [
                        {
                            fieldName: "cibilScore",
                            fieldType: "number",
                            operator: ">=",
                            thresholdValue: "700",
                            documentNotes: "Minimum CIBIL score for approval"
                        }
                    ]
                }
            ]
        });
    }
    
    // Default if no keywords matched
    if (tabs.length === 0) {
        tabs.push({
            name: "General Requirements",
            documentNotes: "Basic policy requirements",
            subTabs: [
                {
                    name: "Eligibility Criteria",
                    documentNotes: "Core eligibility requirements",
                    fields: [
                        {
                            fieldName: "status",
                            fieldType: "string",
                            documentNotes: "Applicant status verification"
                        }
                    ]
                }
            ]
        });
    }
    
    return { tabs };
}
