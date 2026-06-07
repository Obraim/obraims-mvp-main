import type { AiAnalysisResult, LoanApplication } from "@/lib/types";

export type AiAnalysisInput = {
  application: LoanApplication;
};

export interface AiProvider {
  readonly name: string;
  generateLoanAnalysis(input: AiAnalysisInput): Promise<AiAnalysisResult>;
}
