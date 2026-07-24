import { GroqProvider } from '../providers/groq.provider.js';
import {
  emergencyTriageSystemPrompt,
  buildEmergencyTriageUserPrompt,
} from '../prompts/emergency.prompt.js';
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
import ApiError from '../utils/ApiError.js';
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
