import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const createLovableAiGatewayProvider = (apiKey: string) =>
  createOpenAICompatible({
    name: "lovable",
    apiKey,
    baseURL: "https://ai.gateway.lovable.dev/v1",
  });
