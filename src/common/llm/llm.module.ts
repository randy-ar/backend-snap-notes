import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiService } from './gemini.service';
import { OpenRouterService } from './openrouter.service';
import { LLMFactory } from './llm.factory';

@Module({
  imports: [ConfigModule],
  providers: [GeminiService, OpenRouterService, LLMFactory],
  exports: [GeminiService, OpenRouterService, LLMFactory],
})
export class LLMModule {}
