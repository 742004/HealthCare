/**
 * Validates AI output to ensure it does not break safety rules.
 */
export const validateAIResponse = (response) => {
  if (typeof response !== 'string') return response;

  const lowerResp = response.toLowerCase();

  // 1. Diagnosis Checks
  const diagnosisPatterns = [
    "i diagnose you with",
    "you definitely have",
    "you are suffering from",
    "my diagnosis is",
    "you have a heart attack",
    "you have dengue",
    "you have pneumonia",
    "you definitely have cancer",
    "it is certain that you have"
  ];

  for (const pattern of diagnosisPatterns) {
    if (lowerResp.includes(pattern)) {
      return `These symptoms can have several possible causes. A qualified healthcare professional needs to evaluate you to determine the cause. 

I am an AI and cannot diagnose you with certainty.`;
    }
  }

  // 2. Prescription Checks
  const prescriptionPatterns = [
    "take 500mg",
    "i prescribe",
    "you must take",
    "stop taking your",
    "change your prescription"
  ];

  for (const pattern of prescriptionPatterns) {
    if (lowerResp.includes(pattern)) {
      return `For personalized medication decisions, please consult a qualified doctor or pharmacist. I cannot prescribe or alter medication instructions.`;
    }
  }

  return response;
};
