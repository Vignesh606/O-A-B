import { BaseProvider } from './base.provider';
import { ProviderConfig, AIRequest, AIResponse } from '../types/gateway.types';
import { MODELS_CONFIG } from '../config/models.config';
import { PROVIDER_CONFIG } from '../config/provider.config';
import { SafeCompletionExtractor } from './safe-completion';
import { logger } from '../../shared/utils/logger';

/**
 * Claude Provider using the official @anthropic-ai/sdk.
 */
export class ClaudeProvider extends BaseProvider {
  readonly name = 'anthropic' as const;
  readonly providerName = 'ANTHROPIC' as const;

  constructor(config: Partial<ProviderConfig> = {}) {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Anthropic API key is missing. Set ANTHROPIC_API_KEY.");
    }
    super({ ...config, apiKey });
  }

  async generate<T>(request: AIRequest<T>): Promise<AIResponse<T>> {
    const model = MODELS_CONFIG.ANTHROPIC[request.modelTier || 'CAPABLE'];

    const messages = [
      { role: 'user', content: request.prompt }
    ];

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: request.maxTokens || 4096,
          system: request.systemPrompt,
          messages,
          temperature: request.temperature ?? 0.2,
        }),
      });

      const payload = await response.json() as any;
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${JSON.stringify(payload)}`);
      }

      const content = SafeCompletionExtractor.extractAnthropic(payload, 'ANTHROPIC');

      return {
        content,
        parsedOutput: undefined,
        usage: SafeCompletionExtractor.extractUsage(payload),
        model: payload.model || model,
      };
    } catch (error) {
      logger.error('ClaudeProvider', 'GENERATION_FAILED', `Generation failed for tier ${request.modelTier}`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
