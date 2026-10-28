import { AgentBuilder } from '@iqai/adk';
import { google } from '@ai-sdk/google';
import type { AgentConfig } from '../types.ts';

export type { AgentConfig };

export function createAgent(config: AgentConfig): any {
    let builder = AgentBuilder.create(config.name || 'default_agent');

    // Gemini is the primary provider for this project
    if (process.env.GEMINI_API_KEY) {
        const model = google(process.env.GEMINI_MODEL || 'gemini-2.0-flash');
        // @ts-ignore
        builder = builder.withModel(model);
    } else {
        // Fallback to default ADK model string (OpenAI) if Gemini is missing
        const model = process.env.ADK_MODEL || 'gpt-4o';
        // @ts-ignore
        builder = builder.withModel(model);
    }

    if (config.instructions) {
        // @ts-ignore
        builder = builder.withInstruction(config.instructions);
    }

    if (config.tools) {
        // @ts-ignore
        builder = builder.withTools(...config.tools);
    }

    // @ts-ignore
    return builder.build();
}
