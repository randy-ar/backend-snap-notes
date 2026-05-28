import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ILLMProvider } from './llm-provider.interface';
import { GeminiService } from './gemini.service';
import { OpenRouterService } from './openrouter.service';

type LLMProviderType = 'gemini' | 'openrouter';

@Injectable()
export class LLMFactory {
  private readonly logger = new Logger(LLMFactory.name);
  private provider: ILLMProvider;
  private providerType: LLMProviderType;

  constructor(private configService: ConfigService) {
    this.providerType = (this.configService.get<string>('LLM_PROVIDER') || 'gemini') as LLMProviderType;
    this.logger.log(`Initializing LLM provider: ${this.providerType}`);
    this.provider = this.createProvider();
  }

  getProvider(): ILLMProvider {
    return this.provider;
  }

  getProviderType(): LLMProviderType {
    return this.providerType;
  }

  private createProvider(): ILLMProvider {
    switch (this.providerType) {
      case 'gemini':
        return new GeminiService(this.configService);
      case 'openrouter':
        return new OpenRouterService(this.configService);
      default:
        this.logger.warn(`Unknown LLM provider "${this.providerType}", falling back to Gemini`);
        return new GeminiService(this.configService);
    }
  }
}
