import { GroqProvider } from '../providers/groq.provider.js';
import {
  emergencyTriageSystemPrompt,
  buildEmergencyTriageUserPrompt,
} from '../prompts/emergency.prompt.js';
import {
  chatSystemPrompt,
  buildChatUserPrompt,
} from '../prompts/chat.prompt.js';
import { searchNearbyHospitals } from '../utils/geo.utils.js';
import { getEmergencyFallback } from '../utils/fallback.knowledge.js';
import { validateAIResponse } from '../utils/safety.validator.js';
import {
  hospitalRecommendationSystemPrompt,
  buildHospitalRecommendationUserPrompt,
} from '../prompts/hospital.prompt.js';
import {
  doctorRecommendationSystemPrompt,
  buildDoctorRecommendationUserPrompt,
} from '../prompts/doctor.prompt.js';
import {
  medicalSummarySystemPrompt,
  buildMedicalSummaryUserPrompt,
} from '../prompts/medicalSummary.prompt.js';
import {
  emergencyReportSystemPrompt,
  buildEmergencyReportUserPrompt,
} from '../prompts/emergencyReport.prompt.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * AI Service
 * 
 * High-level orchestration of AI workflows. 
 * Delegates API calls to the injected AI Provider (Groq).
 */
class AIService {
  constructor() {
    this.provider = new GroqProvider(); // Dependency Injection could be used here
  }

  async chat({ message, context }) {
    try {
      // 1. Normalize Question
      const lowerMsg = message.trim().toLowerCase();
      if (!lowerMsg) return { reply: "Please enter a message." };

      // 2. Healthcare Scope Gate
      const outOfScopeKeywords = ['president', 'joke', 'cricket', 'python', 'java', 'hack', 'code', 'essay', 'who won', 'resume', 'weather', 'blockchain', 'investment'];
      if (outOfScopeKeywords.some(keyword => lowerMsg.includes(keyword))) {
        return { type: 'OUT_OF_SCOPE', content: "I'm Healthcare AI.\n\nI can help with health, diseases, symptoms, injuries, first aid, emergency guidance, hospitals and ambulance-related questions.\n\nPlease ask a healthcare-related question." };
      }

      // 3. Intent Classifier
      let intent = 'GENERAL_HEALTH';
      const hospitalKeywords = ['hospital', 'nearest', 'nearby', 'clinic'];
      const emergencyKeywords = ['heart attack', 'stroke', 'bleeding', 'unconscious', 'breathing', 'choking', 'allergic', 'seizure', 'burn', 'fracture', 'head injury', 'poisoning', 'emergency'];
      const ambulanceKeywords = ['ambulance', 'eta', 'where is'];

      if (hospitalKeywords.some(keyword => lowerMsg.includes(keyword))) {
        intent = 'HOSPITAL_SEARCH';
      } else if (ambulanceKeywords.some(keyword => lowerMsg.includes(keyword))) {
        intent = 'AMBULANCE';
      } else if (emergencyKeywords.some(keyword => lowerMsg.includes(keyword))) {
        intent = 'EMERGENCY';
      }

      // 4. Action Routing & Fast Fallbacks
      let enrichedContext = { ...context };
      
      if (intent === 'EMERGENCY') {
        const fallback = getEmergencyFallback(lowerMsg);
        if (fallback) {
          return { type: 'EMERGENCY', content: fallback };
        }
      }

      if (intent === 'HOSPITAL_SEARCH') {
        if (!context?.location) {
          return { type: 'ERROR', content: "I need your current location to find nearby hospitals.\n\nPlease enable location access and click Update Location." };
        }
        
        const hospitals = await searchNearbyHospitals(context.location.lat, context.location.lng);
        if (hospitals.length === 0) {
          return { type: 'ERROR', content: "I couldn't retrieve verified nearby hospital information right now.\n\nPlease update your location and try again, or open Google Maps to search for nearby healthcare facilities." };
        }
        
        return { type: 'HOSPITALS', hospitals };
      }

      if (intent === 'AMBULANCE') {
        if (context?.activeEmergency?.status === 'ON_THE_WAY') {
          return { type: 'AMBULANCE', content: "An ambulance has been assigned, but a reliable ETA is not currently available." };
        }
        return { type: 'AMBULANCE', content: "No ambulance is currently assigned to your emergency request." };
      }

      // 5. AI Explanation Layer
      const userPrompt = buildChatUserPrompt(message, enrichedContext);
      let aiResult;
      
      try {
        aiResult = await this.provider.generate(chatSystemPrompt, userPrompt);
      } catch (err) {
        // Fallback if AI provider is down, but intent wasn't caught by the explicit fast-fallback
        if (intent === 'EMERGENCY') {
           return { type: 'EMERGENCY', content: "Call your local emergency medical service immediately. Do not delay emergency medical care while waiting for an AI response." };
        }
        logger.error(`AI Provider failure: ${err.message}`);
        return { type: 'ERROR', content: "The healthcare AI service is temporarily unavailable.\n\nPlease try again shortly or consult a qualified healthcare professional for medical advice." };
      }
      
      let rawReply = typeof aiResult === 'string' ? aiResult : aiResult.reply || JSON.stringify(aiResult);
      
      // 6. Safety Validator
      const validatedReply = validateAIResponse(rawReply);
      
      return { type: 'MEDICAL', content: validatedReply };
    } catch (error) {
      logger?.error(`AI Service chat failed: ${error.message}`);
      return { type: 'ERROR', content: "I don't have enough verified information to answer that reliably. Please consult a qualified healthcare professional." };
    }
  }

  async triageEmergency(emergencyData) {
    try {
      const userPrompt = buildEmergencyTriageUserPrompt(emergencyData);
      const result = await this.provider.generate(emergencyTriageSystemPrompt, userPrompt);
      return result;
    } catch (error) {
      logger?.error(`AI Service triageEmergency failed: ${error.message}`);
      throw new ApiError(500, 'AI triage failed to process the request.');
    }
  }

  async recommendHospital(hospitalData) {
    try {
      const userPrompt = buildHospitalRecommendationUserPrompt(hospitalData);
      const result = await this.provider.generate(hospitalRecommendationSystemPrompt, userPrompt);
      return result;
    } catch (error) {
      logger?.error(`AI Service recommendHospital failed: ${error.message}`);
      throw new ApiError(500, 'AI hospital recommendation failed.');
    }
  }

  async recommendDoctor(doctorData) {
    try {
      const userPrompt = buildDoctorRecommendationUserPrompt(doctorData);
      const result = await this.provider.generate(doctorRecommendationSystemPrompt, userPrompt);
      return result;
    } catch (error) {
      logger?.error(`AI Service recommendDoctor failed: ${error.message}`);
      throw new ApiError(500, 'AI doctor recommendation failed.');
    }
  }

  async summarizeMedicalRecord(records) {
    try {
      const userPrompt = buildMedicalSummaryUserPrompt(records);
      const result = await this.provider.generate(medicalSummarySystemPrompt, userPrompt);
      return result;
    } catch (error) {
      logger?.error(`AI Service summarizeMedicalRecord failed: ${error.message}`);
      throw new ApiError(500, 'AI medical summary generation failed.');
    }
  }

  async generateEmergencyReport(reportData) {
    try {
      const userPrompt = buildEmergencyReportUserPrompt(reportData);
      const result = await this.provider.generate(emergencyReportSystemPrompt, userPrompt);
      return result;
    } catch (error) {
      logger?.error(`AI Service generateEmergencyReport failed: ${error.message}`);
      throw new ApiError(500, 'AI emergency report generation failed.');
    }
  }
}

export default new AIService();
