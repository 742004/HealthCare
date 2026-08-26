import { jest } from '@jest/globals';
import aiService from '../../src/services/ai.service.js';
import * as geoUtils from '../../src/utils/geo.utils.js';
import * as safetyValidator from '../../src/utils/safety.validator.js';

// Mock dependencies
jest.unstable_mockModule('../../src/utils/geo.utils.js', () => ({
  searchNearbyHospitals: jest.fn(),
}));

describe.skip('AI Service', () => {
  beforeAll(async () => {
    // Mock the provider
    jest.spyOn(aiService.provider, 'generate').mockResolvedValue('Mocked AI response');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return error for empty message', async () => {
    const result = await aiService.chat({ message: '   ', context: {} });
    expect(result.reply).toBe('Please enter a message.');
  });

  it('should block out-of-scope keywords', async () => {
    const result = await aiService.chat({ message: 'tell me a joke about cricket', context: {} });
    expect(result.type).toBe('OUT_OF_SCOPE');
    expect(result.content).toContain('Please ask a healthcare-related question');
  });

  it('should route to EMERGENCY fallback immediately if keywords match', async () => {
    const result = await aiService.chat({ message: 'I am having a heart attack', context: {} });
    expect(result.type).toBe('EMERGENCY');
    expect(result.content).toContain('Call local emergency numbers immediately');
  });

  it('should return HOSPITAL_SEARCH error if no location provided', async () => {
    const result = await aiService.chat({ message: 'find nearest hospital', context: {} });
    expect(result.type).toBe('ERROR');
    expect(result.content).toContain('need your current location');
  });

  it('should call AI provider for general medical questions', async () => {
    const result = await aiService.chat({ message: 'What are the symptoms of flu?', context: {} });
    expect(result.type).toBe('MEDICAL');
    expect(aiService.provider.generate).toHaveBeenCalled();
  });
});
