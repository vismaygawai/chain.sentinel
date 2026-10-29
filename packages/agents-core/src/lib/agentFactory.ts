import { AgentBuilder } from '@iqai/adk';
import type { AgentConfig } from '../types.ts';

export type { AgentConfig };

export interface AgentInstance {
  config: AgentConfig;
  getBuilt: () => Promise<any>;
  ask: (prompt: string) => Promise<string>;
  build: () => Promise<any>;
}

export function createAgent(config: AgentConfig): AgentInstance {
  let builtPromise: Promise<any> | null = null;

  async function getBuilt(): Promise<any> {
    if (!builtPromise) {
      builtPromise = (async () => {
        const safeName = (config.name || 'default_agent').replace(/[^a-zA-Z0-9_]/g, '_');
        let builder = AgentBuilder.create(safeName);

        // Gemini is the primary provider for this project
        const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (geminiKey) {
          if (!process.env.GOOGLE_API_KEY) {
            process.env.GOOGLE_API_KEY = geminiKey;
          }
          const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
          builder = builder.withModel(modelName);
        } else {
          // Fallback to default ADK model string if Gemini is missing
          const model = process.env.ADK_MODEL || 'gpt-4o';
          builder = builder.withModel(model);
        }

        if (config.instructions) {
          builder = builder.withInstruction(config.instructions);
        }

        if (config.tools) {
          builder = builder.withTools(...config.tools);
        }

        return await builder.build();
      })();
    }
    return builtPromise;
  }

  return {
    config,
    getBuilt,
    async ask(prompt: string): Promise<string> {
      const built = await getBuilt();
      if (!built || !built.runner || typeof built.runner.ask !== 'function') {
        throw new Error('ADK agent runner not available');
      }
      const res = await built.runner.ask(prompt);
      return typeof res === 'string' ? res : (res?.text || JSON.stringify(res));
    },
    async build(): Promise<any> {
      return getBuilt();
    },
  };
}
