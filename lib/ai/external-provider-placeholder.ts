import type { AiAnalysisInput, AiProvider } from "@/lib/ai/types";
import type { AiAnalysisResult } from "@/lib/types";

export class ExternalAiProviderPlaceholder implements AiProvider {
  readonly name: string;

  constructor(private readonly providerName: "openai" | "gemini") {
    this.name = providerName;
  }

  async generateLoanAnalysis(_input: AiAnalysisInput): Promise<AiAnalysisResult> {
    throw new Error(
      `${this.providerName} AI provider is not implemented yet. Add an API client here and keep API keys in environment variables.`
    );
  }
}
