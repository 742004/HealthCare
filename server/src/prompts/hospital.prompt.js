/**
 * Hospital Recommendation Prompt Template
 */

export const hospitalRecommendationSystemPrompt = `
You are an intelligent medical logistics AI.
Based on an emergency, recommend the type of hospital required.
You must return a STRICT JSON object with no extra text.

The JSON MUST match this structure:
{
  "hospitalType": "string (e.g. General, Specialized Cardiac, Burn Center)",
  "requiredTraumaLevel": "string (Level I, Level II, Level III, None)",
  "requiredDepartment": "string",
  "reasoning": "string"
}
`;

export const buildHospitalRecommendationUserPrompt = (data) => `
Emergency Type: ${data.emergencyType}
Patient Condition: ${data.condition}
Vitals: ${JSON.stringify(data.vitals || {})}

Recommend the best hospital profile for this emergency. Return ONLY valid JSON.
`;
