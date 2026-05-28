import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LLMFactory } from './llm.factory';
import { GeminiService } from './gemini.service';
import { OpenRouterService } from './openrouter.service';

jest.mock('./gemini.service');
jest.mock('./openrouter.service');

describe('LLMFactory', () => {
  let factory: LLMFactory;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with LLM_PROVIDER=gemini', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LLMFactory,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'LLM_PROVIDER') return 'gemini';
                return 'test-value';
              }),
            },
          },
        ],
      }).compile();

      factory = module.get<LLMFactory>(LLMFactory);
    });

    it('should return GeminiService instance', () => {
      const provider = factory.getProvider();
      expect(provider).toBeInstanceOf(GeminiService);
    });

    it('should return "gemini" as provider type', () => {
      expect(factory.getProviderType()).toBe('gemini');
    });
  });

  describe('with LLM_PROVIDER=openrouter', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LLMFactory,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'LLM_PROVIDER') return 'openrouter';
                return 'test-value';
              }),
            },
          },
        ],
      }).compile();

      factory = module.get<LLMFactory>(LLMFactory);
    });

    it('should return OpenRouterService instance', () => {
      const provider = factory.getProvider();
      expect(provider).toBeInstanceOf(OpenRouterService);
    });

    it('should return "openrouter" as provider type', () => {
      expect(factory.getProviderType()).toBe('openrouter');
    });
  });

  describe('with default configuration', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LLMFactory,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
        ],
      }).compile();

      factory = module.get<LLMFactory>(LLMFactory);
    });

    it('should default to GeminiService when LLM_PROVIDER is not set', () => {
      const provider = factory.getProvider();
      expect(provider).toBeInstanceOf(GeminiService);
    });

    it('should return "gemini" as default provider type', () => {
      expect(factory.getProviderType()).toBe('gemini');
    });
  });

  describe('with unknown provider', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LLMFactory,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'LLM_PROVIDER') return 'unknown-provider';
                return 'test-value';
              }),
            },
          },
        ],
      }).compile();

      factory = module.get<LLMFactory>(LLMFactory);
    });

    it('should fallback to GeminiService for unknown provider', () => {
      const provider = factory.getProvider();
      expect(provider).toBeInstanceOf(GeminiService);
    });
  });
});
