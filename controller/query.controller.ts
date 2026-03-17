import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import asyncHandler from "@/utils/AsyncHandlerService";
import axios from "axios";

export const queryPolicy = asyncHandler(async (policyId: string, query: string) => {
    const policy = await prisma.policyEngine.findUnique({
        where: { id: policyId },
        include: {
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

    const policyContext = buildPolicyContext(policy);
    const aiResponse = await evaluateWithAI(query, policyContext);
    
    return aiResponse;
});

function buildPolicyContext(policy: any): string {
    let context = `Policy: ${policy.name}\nProduct: ${policy.product}\n\nRules:\n`;
    
    policy.tabs.forEach((tab: any) => {
        tab.subTabs.forEach((subTab: any) => {
            subTab.fields.forEach((field: any) => {
                if (field.operator && field.thresholdValue) {
                    context += `- ${field.fieldName} ${field.operator} ${field.thresholdValue}\n`;
                    if (field.documentNotes) {
                        context += `  Reason: ${field.documentNotes}\n`;
                    }
                }
                if (field.fieldValues) {
                    context += `- ${field.fieldName} must be: ${field.fieldValues}\n`;
                }
                if (field.rules) {
                    context += `- ${field.fieldName}: ${field.rules}\n`;
                }
            });
        });
    });
    
    return context;
}

async function evaluateWithAI(query: string, policyContext: string): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        return generateFallbackResponse(query, policyContext);
    }

    const prompt = `You are a policy evaluation engine. Based on the policy rules provided, answer the user's query.

Policy Rules:
${policyContext}

User Query: ${query}

Analyze the query against the policy rules and provide:
1. Decision: Approved/Rejected/Needs Review
2. Reason: Detailed explanation
3. Applicable Rules: Which rules were evaluated
4. Recommendations: If rejected, what needs to change

Respond in JSON format:
{
  "decision": "Approved|Rejected|Needs Review",
  "reason": "explanation",
  "applicableRules": ["rule1", "rule2"],
  "recommendations": "suggestions if rejected"
}`;

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 1000
            },
            { headers: { "Authorization": `Bearer ${apiKey}` } }
        );

        const content = response.data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (error) {
        console.error("AI evaluation failed:", error);
    }
    
    return generateFallbackResponse(query, policyContext);
}

function generateFallbackResponse(query: string, policyContext: string): any {
    const lowerQuery = query.toLowerCase();
    const rules = policyContext.split('\n').filter(line => line.startsWith('- '));
    
    const violations: string[] = [];
    const applicableRules: string[] = [];
    const passedRules: string[] = [];
    
    // Parse query for field values
    const queryData: any = {};
    
    // Extract CIBIL/Credit Score
    const cibilMatch = query.match(/cibil[\s\w]*?(\d{3})/i) || query.match(/credit[\s\w]*?score[\s\w]*?(\d{3})/i);
    if (cibilMatch) queryData.cibil = parseInt(cibilMatch[1]);
    
    // Extract Age
    const ageMatch = query.match(/age[\s\w]*?(\d{2})/i) || query.match(/(\d{2})[\s\w]*?years?[\s\w]*?old/i);
    if (ageMatch) queryData.age = parseInt(ageMatch[1]);
    
    // Extract Income
    const incomeMatch = query.match(/income[\s\w]*?(\d{6,})/i) || query.match(/earn[\s\w]*?(\d{6,})/i);
    if (incomeMatch) queryData.income = parseInt(incomeMatch[1]);
    
    // Extract Employment Months
    const employmentMatch = query.match(/employed[\s\w]*?(\d+)[\s\w]*?months?/i) || query.match(/(\d+)[\s\w]*?months?[\s\w]*?job/i);
    if (employmentMatch) queryData.employment = parseInt(employmentMatch[1]);
    
    // Evaluate each rule
    rules.forEach(rule => {
        const ruleLower = rule.toLowerCase();
        
        // CIBIL Score
        if ((ruleLower.includes('cibil') || ruleLower.includes('credit')) && queryData.cibil) {
            const match = rule.match(/(>=|<=|>|<|==)\s*(\d+)/);
            if (match) {
                const operator = match[1];
                const threshold = parseInt(match[2]);
                const value = queryData.cibil;
                
                let passes = false;
                if (operator === '>=') passes = value >= threshold;
                else if (operator === '<=') passes = value <= threshold;
                else if (operator === '>') passes = value > threshold;
                else if (operator === '<') passes = value < threshold;
                else if (operator === '==') passes = value === threshold;
                
                applicableRules.push(rule);
                if (!passes) {
                    violations.push(`CIBIL score ${value} does not meet requirement (${operator} ${threshold})`);
                } else {
                    passedRules.push(rule);
                }
            }
        }
        
        // Age
        if (ruleLower.includes('age') && queryData.age) {
            const match = rule.match(/(>=|<=|>|<|==)\s*(\d+)/);
            if (match) {
                const operator = match[1];
                const threshold = parseInt(match[2]);
                const value = queryData.age;
                
                let passes = false;
                if (operator === '>=') passes = value >= threshold;
                else if (operator === '<=') passes = value <= threshold;
                else if (operator === '>') passes = value > threshold;
                else if (operator === '<') passes = value < threshold;
                else if (operator === '==') passes = value === threshold;
                
                applicableRules.push(rule);
                if (!passes) {
                    violations.push(`Age ${value} does not meet requirement (${operator} ${threshold})`);
                } else {
                    passedRules.push(rule);
                }
            }
        }
        
        // Income
        if (ruleLower.includes('income') && queryData.income) {
            const match = rule.match(/(>=|<=|>|<|==)\s*(\d+)/);
            if (match) {
                const operator = match[1];
                const threshold = parseInt(match[2]);
                const value = queryData.income;
                
                let passes = false;
                if (operator === '>=') passes = value >= threshold;
                else if (operator === '<=') passes = value <= threshold;
                else if (operator === '>') passes = value > threshold;
                else if (operator === '<') passes = value < threshold;
                else if (operator === '==') passes = value === threshold;
                
                applicableRules.push(rule);
                if (!passes) {
                    violations.push(`Income ${value} does not meet requirement (${operator} ${threshold})`);
                } else {
                    passedRules.push(rule);
                }
            }
        }
        
        // Employment
        if ((ruleLower.includes('employment') || ruleLower.includes('job')) && queryData.employment) {
            const match = rule.match(/(>=|<=|>|<|==)\s*(\d+)/);
            if (match) {
                const operator = match[1];
                const threshold = parseInt(match[2]);
                const value = queryData.employment;
                
                let passes = false;
                if (operator === '>=') passes = value >= threshold;
                else if (operator === '<=') passes = value <= threshold;
                else if (operator === '>') passes = value > threshold;
                else if (operator === '<') passes = value < threshold;
                else if (operator === '==') passes = value === threshold;
                
                applicableRules.push(rule);
                if (!passes) {
                    violations.push(`Employment tenure ${value} months does not meet requirement (${operator} ${threshold})`);
                } else {
                    passedRules.push(rule);
                }
            }
        }
    });
    
    if (violations.length > 0) {
        return {
            decision: "Rejected",
            reason: violations.join('. ') + '.',
            applicableRules: applicableRules,
            recommendations: `Applicant must meet all requirements: ${violations.join('; ')}.`
        };
    }
    
    if (applicableRules.length > 0) {
        return {
            decision: "Approved",
            reason: `All ${applicableRules.length} applicable policy requirements are met.`,
            applicableRules: passedRules,
            recommendations: "Proceed with standard verification and documentation."
        };
    }
    
    return {
        decision: "Needs Review",
        reason: "Unable to extract sufficient information from query to evaluate against policy rules.",
        applicableRules: rules,
        recommendations: "Please provide specific values for: CIBIL score, age, income, and employment tenure."
    };
}
