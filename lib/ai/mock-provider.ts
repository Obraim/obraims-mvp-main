import type { AiAnalysisInput, AiProvider } from "@/lib/ai/types";
import type { AiAnalysisResult, DocumentType } from "@/lib/types";

const requiredDocuments: DocumentType[] = ["ID", "BANK_STATEMENT", "TAX_RETURN"];

export class MockAiProvider implements AiProvider {
  readonly name = "mock";

  async generateLoanAnalysis({ application }: AiAnalysisInput): Promise<AiAnalysisResult> {
    const uploadedTypes = new Set(application.documents.map((document) => document.documentType));
    const missingDocuments = requiredDocuments.filter((type) => !uploadedTypes.has(type));
    const amountRisk = application.requestedAmount > 250000 ? 24 : application.requestedAmount > 75000 ? 12 : 6;
    const documentRisk = missingDocuments.length * 12;
    const businessRisk =
      application.borrowerProfile.borrowerType === "BUSINESS" && !application.borrowerProfile.annualRevenue ? 8 : 0;
    const riskScore = Math.min(95, 28 + amountRisk + documentRisk + businessRisk);
    const riskLevel = riskScore >= 70 ? "HIGH" : riskScore >= 45 ? "MEDIUM" : "LOW";

    const riskFlags = [
      application.requestedAmount > 250000 ? "Large requested exposure requires senior credit review." : "",
      missingDocuments.length > 0 ? "Application is missing required underwriting documents." : "",
      businessRisk > 0 ? "Business operating history is incomplete." : "",
      application.requestedTermMonths > 84 ? "Long repayment term may increase repayment uncertainty." : ""
    ].filter(Boolean);


    return {
      provider: this.name,
      model: "mock-credit-analyst-v1",
      summary: `${application.borrowerProfile.borrowerType.toLowerCase()} request for ${new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: application.currency
      }).format(application.requestedAmount)} over ${application.requestedTermMonths} months. Purpose: ${application.loanPurpose}. Initial review indicates ${riskLevel.toLowerCase()} risk pending document verification.`,
      creditMemoDraft: [
        `Borrower requests ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: application.currency,
          maximumFractionDigits: 0
        }).format(application.requestedAmount)} for ${application.loanPurpose.toLowerCase()}`,
        `Proposed tenor is ${application.requestedTermMonths} months. Current automated risk score is ${riskScore}/100 with a ${riskLevel.toLowerCase()} preliminary risk level.`,
        missingDocuments.length > 0
          ? `Credit file is not yet complete. Missing items: ${missingDocuments.map((type) => type.replaceAll("_", " ")).join(", ")}.`
          : "Required MVP documents are present for initial analyst review.",
        "Final credit decision remains with the lender's authorized loan officer or credit committee."
      ].join("\n\n"),
      riskLevel,
      riskScore,
      riskFlags: riskFlags.length > 0 ? riskFlags : ["No major automated risk flags from available MVP data."],
      missingDocuments,
      recommendedActions: [
        "Verify borrower identity and contact information.",
        "Review bank statement cash flow consistency.",
        "Compare requested amount against income or revenue profile.",
        missingDocuments.length > 0
          ? "Request missing documents before full credit decision."
          : "Move to analyst review after document quality check."
      ],
      followUpQuestions: [
        "Can the borrower explain the primary source of repayment for the requested facility?",
        "Are there existing liens, guarantees, or collateral claims that should be disclosed?",
        missingDocuments.length > 0
          ? "When can the borrower provide the missing underwriting documents?"
          : "Does the borrower expect any material change in income, revenue, or cash flow during the loan term?"
      ]
    };
  }
}
