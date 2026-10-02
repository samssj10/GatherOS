import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { ScheduleItem } from '../types';
import { AppError } from '../utils/AppError';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { SCHEDULE_CATEGORIES, scheduleItemSchema } from '../utils/scheduleSchema';

export interface GenerateScheduleInput {
  prompt: string;
  city?: string;
  days: number;
  attendeeCount: number;
  budget?: number;
}

export const SYSTEM_PROMPT =
  'You are an elite corporate event planner organizing an offsite. Generate a realistic, engaging itinerary. Space out intensive workshops with 15-minute buffer periods. Ensure catering estimates are realistic for the requested city. Do not schedule heavy keynotes immediately after lunch. Output strictly matching the requested JSON schema.';

// Structured outputs require an object at the root, so the ScheduleItem[] is wrapped in `items`.
export const SCHEDULE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'id',
          'day',
          'startTime',
          'endTime',
          'title',
          'description',
          'location',
          'category',
          'costEstimate',
        ],
        properties: {
          id: { type: 'string' },
          day: { type: 'integer' },
          startTime: { type: 'string', description: '24-hour HH:mm' },
          endTime: { type: 'string', description: '24-hour HH:mm' },
          title: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
          category: { type: 'string', enum: [...SCHEDULE_CATEGORIES] },
          costEstimate: { type: 'number', description: 'Total estimated cost in USD' },
        },
      },
    },
  },
};

const scheduleResponseSchema = z.object({ items: z.array(scheduleItemSchema).min(1) });

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new AppError(503, 'AI generation is not configured on this server', 'AI_NOT_CONFIGURED');
  }
  client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL });
  return client;
}

function buildUserMessage(input: GenerateScheduleInput): string {
  const lines = [`Number of days: ${input.days}`, `Attendees: ${input.attendeeCount}`];
  if (input.city) lines.unshift(`City: ${input.city}`);
  if (input.budget !== undefined) lines.push(`Total budget (USD): ${input.budget}`);
  lines.push(`Planner request: ${input.prompt}`);
  return lines.join('\n');
}

function toUpstreamError(err: unknown): AppError {
  // Most specific first: only a rate limit is worth telling the caller to retry.
  if (err instanceof Anthropic.RateLimitError) {
    logger.warn({ status: err.status }, 'Anthropic rate limit reached');
    return new AppError(503, 'The AI provider is busy, please retry shortly', 'AI_UPSTREAM_BUSY');
  }
  if (err instanceof Anthropic.AuthenticationError) {
    logger.error({ status: err.status }, 'Anthropic rejected the configured API key');
    return new AppError(502, 'The AI provider rejected the server credentials', 'AI_UPSTREAM_ERROR');
  }
  if (err instanceof Anthropic.APIError) {
    logger.error({ status: err.status, message: err.message }, 'Anthropic request failed');
    return new AppError(502, 'The AI provider failed to respond', 'AI_UPSTREAM_ERROR');
  }
  logger.error({ err }, 'Unexpected error calling Anthropic');
  return new AppError(502, 'The AI provider failed to respond', 'AI_UPSTREAM_ERROR');
}

export async function generateSchedule(input: GenerateScheduleInput): Promise<ScheduleItem[]> {
  const anthropic = getClient();

  let message: Anthropic.Message;
  try {
    message = await anthropic.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(input) }],
      output_config: { format: { type: 'json_schema', schema: SCHEDULE_JSON_SCHEMA } },
    });
  } catch (err) {
    throw toUpstreamError(err);
  }

  logger.info(
    {
      model: message.model,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      stopReason: message.stop_reason,
    },
    'AI token usage',
  );

  if (message.stop_reason === 'refusal') {
    throw new AppError(502, 'The AI provider declined to generate a schedule', 'AI_REFUSED');
  }
  if (message.stop_reason === 'max_tokens') {
    throw new AppError(502, 'The AI response was cut off before completing', 'AI_INVALID_RESPONSE');
  }

  const text = message.content.find((block) => block.type === 'text');
  if (!text || text.type !== 'text') {
    throw new AppError(502, 'The AI provider returned no content', 'AI_INVALID_RESPONSE');
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text.text);
  } catch {
    throw new AppError(502, 'The AI provider returned invalid JSON', 'AI_INVALID_RESPONSE');
  }

  // Never trust model output, even with structured outputs: re-validate at runtime.
  const parsed = scheduleResponseSchema.safeParse(raw);
  if (!parsed.success) {
    logger.error({ issues: parsed.error.issues }, 'AI response failed validation');
    throw new AppError(502, 'The AI provider returned an invalid schedule', 'AI_INVALID_RESPONSE');
  }

  // Model-chosen ids are not trusted to be unique; drag-and-drop and saving both rely on that.
  return parsed.data.items.map((item, index) => ({
    ...item,
    id: `ai-${String(index + 1).padStart(3, '0')}`,
  }));
}
