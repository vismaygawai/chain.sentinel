import { callQwenLLM } from '../tools/treasuryTools.ts';

export async function callLocalLLM(prompt: string): Promise<string> {
  return callQwenLLM(prompt);
}
