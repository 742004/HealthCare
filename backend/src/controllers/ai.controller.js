import aiService from '../services/ai.service.js';
import { asyncHandler as catchAsync } from '../utils/asyncHandler.js';

/**
 * AI Controller
 * 
 * Thin adapter layer. Receives HTTP requests, calls the AI Service, 
 * and returns the structured JSON response to the client.
 */
class AIController {
  
  chat = catchAsync(async (req, res) => {
    const result = await aiService.chat(req.body);
    res.status(200).json({
      success: true,
      message: 'Chat response generated successfully',
      data: result,
    });
  });

  triageEmergency = catchAsync(async (req, res) => {
    const result = await aiService.triageEmergency(req.body);
    res.status(200).json({
      success: true,
      message: 'AI Triage completed successfully',
      data: result,
    });
  });

  recommendHospital = catchAsync(async (req, res) => {
    const result = await aiService.recommendHospital(req.body);
    res.status(200).json({
      success: true,
      message: 'Hospital recommendation generated successfully',
      data: result,
    });
  });

  recommendDoctor = catchAsync(async (req, res) => {
    const result = await aiService.recommendDoctor(req.body);
    res.status(200).json({
      success: true,
      message: 'Doctor recommendation generated successfully',
      data: result,
    });
  });

  summarizeMedicalRecord = catchAsync(async (req, res) => {
    const result = await aiService.summarizeMedicalRecord(req.body);
    res.status(200).json({
      success: true,
      message: 'Medical record summary generated successfully',
      data: result,
    });
  });

  generateEmergencyReport = catchAsync(async (req, res) => {
    const result = await aiService.generateEmergencyReport(req.body);
    res.status(200).json({
      success: true,
      message: 'Emergency report generated successfully',
      data: result,
    });
  });
}

export default new AIController();
