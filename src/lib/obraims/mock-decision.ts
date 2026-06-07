import type { DecisionValue } from "@/src/lib/obraims/simple-core";

export type MockDecisionReason = {
  code: string;
  title: string;
  description?: string;
  severity: "info" | "warning";
};

export type MockDecisionResult = {
  score: number;
  decision: Extract<DecisionValue, "approved" | "rejected">;
  reasons: MockDecisionReason[];
  suggestedApprovedAmount: number | null;
};

// MVP demo only. This is not production underwriting, a credit score, or a
// regulated lending decision model.
export function runMockDecision(input: {
  requested_amount: number;
  requested_term_months: number;
  monthly_income: number | null;
}): MockDecisionResult {
  let score = 650;
  const reasons: MockDecisionReason[] = [];

  if (input.requested_amount <= 1_000_000) {
    score += 50;
    reasons.push({
      code: "REQUEST_AMOUNT_SMALL",
      title: "Requested amount is within MVP comfort range",
      severity: "info"
    });
  }

  if (input.requested_amount > 5_000_000) {
    score -= 70;
    reasons.push({
      code: "REQUEST_AMOUNT_LARGE",
      title: "Requested amount is high for the simple MVP policy",
      severity: "warning"
    });
  }

  if (input.requested_term_months <= 12) {
    score += 30;
    reasons.push({
      code: "SHORT_TERM",
      title: "Requested term is short",
      severity: "info"
    });
  }

  if (input.requested_term_months > 18) {
    score -= 30;
    reasons.push({
      code: "LONG_TERM",
      title: "Requested term is longer than the simple MVP preference",
      severity: "warning"
    });
  }

  if (input.monthly_income !== null && input.requested_amount <= input.monthly_income * 3) {
    score += 30;
    reasons.push({
      code: "INCOME_COVERAGE",
      title: "Requested amount is within three months of stated income",
      severity: "info"
    });
  }

  const decision = score >= 620 ? "approved" : "rejected";

  if (decision === "rejected") {
    reasons.push({
      code: "SCORE_BELOW_THRESHOLD",
      title: "Simple MVP score is below approval threshold",
      description: "This demo decision does not represent production underwriting.",
      severity: "warning"
    });
  }

  return {
    score,
    decision,
    reasons,
    suggestedApprovedAmount: decision === "approved" ? input.requested_amount : null
  };
}
