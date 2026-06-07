import { ExternalAiProviderPlaceholder } from "@/lib/ai/external-provider-placeholder";
import { MockAiProvider } from "@/lib/ai/mock-provider";
import type { AiProvider } from "@/lib/ai/types";

export function getAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER ?? "mock";

  switch (provider) {
    case "mock":
      return new MockAiProvider();
    case "openai":
      return new ExternalAiProviderPlaceholder("openai");
    case "gemini":
      return new ExternalAiProviderPlaceholder("gemini");
    default:
      throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
  }
}
