"use server";

import { headers } from "next/headers";
import { getCurrentUser } from "@/src/lib/obraims/access-control";
import {
  createApplicationFromChat,
  type AIConversationMessage,
  type IntakeDocument
} from "@/src/lib/obraims/simple-core";

export type ChatApplicationPayload = {
  full_name: string;
  phone: string;
  email?: string;
  requested_amount: number;
  requested_term_months: number;
  loan_purpose: string;
  monthly_income?: number | null;
  employment_status: string;
  address_line1: string;
  address_line2?: string | null;
  district_city: string;
  province_state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  has_collateral: boolean;
  collateral_type?: string | null;
  collateral_description?: string | null;
  collateral_estimated_value?: number | null;
  collateral_ownership_status?: string | null;
  collateral_location?: string | null;
  documents: IntakeDocument[];
  consent_granted: boolean;
  transcript: AIConversationMessage[];
};

export type ChatSubmitResult =
  | {
      ok: true;
      applicationId: string;
    }
  | {
      ok: false;
      error: string;
      field?: keyof ChatApplicationPayload;
    };

function isPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isPositiveInteger(value: unknown) {
  return Number.isInteger(value) && Number(value) > 0;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanTranscript(transcript: unknown): AIConversationMessage[] {
  if (!Array.isArray(transcript)) {
    return [];
  }

  const messages: AIConversationMessage[] = [];

  for (const message of transcript) {
    if (!message || typeof message !== "object") {
      continue;
    }

    const candidate = message as Partial<AIConversationMessage>;
    const role = candidate.role;
    const content = cleanText(candidate.content);

    if (!role || !["assistant", "user", "system"].includes(role) || !content) {
      continue;
    }

    messages.push({
      role,
      content,
      metadata: candidate.metadata && typeof candidate.metadata === "object" ? candidate.metadata : undefined,
      created_at: candidate.created_at
    });
  }

  return messages;
}

export async function submitChatApplication(payload: ChatApplicationPayload): Promise<ChatSubmitResult> {
  const fullName = cleanText(payload.full_name);
  const phone = cleanText(payload.phone);
  let email = cleanText(payload.email);
  const loanPurpose = cleanText(payload.loan_purpose);
  const employmentStatus = cleanText(payload.employment_status);
  const addressLine1 = cleanText(payload.address_line1);
  const districtCity = cleanText(payload.district_city);
  const collateralType = cleanText(payload.collateral_type);
  const collateralDescription = cleanText(payload.collateral_description);
  const currentUser = await getCurrentUser();
  const authenticatedEmail = currentUser?.email?.trim().toLowerCase() ?? null;

  if (authenticatedEmail) {
    if (email && email.toLowerCase() !== authenticatedEmail) {
      return {
        ok: false,
        field: "email",
        error: "Use the same email as your signed-in Obraims account."
      };
    }

    email = authenticatedEmail;
  }

  if (!fullName) {
    return { ok: false, field: "full_name", error: "Please enter your full name." };
  }

  if (!phone) {
    return { ok: false, field: "phone", error: "Please enter your phone number." };
  }

  if (!isPositiveNumber(payload.requested_amount)) {
    return { ok: false, field: "requested_amount", error: "Loan amount must be greater than 0." };
  }

  if (!isPositiveInteger(payload.requested_term_months)) {
    return { ok: false, field: "requested_term_months", error: "Please enter a positive number of months." };
  }

  if (!loanPurpose) {
    return { ok: false, field: "loan_purpose", error: "Please describe your loan purpose." };
  }

  if (payload.monthly_income !== null && payload.monthly_income !== undefined && !isPositiveNumber(payload.monthly_income)) {
    return { ok: false, field: "monthly_income", error: "Monthly income must be greater than 0, or leave blank." };
  }

  if (!employmentStatus) {
    return { ok: false, field: "employment_status", error: "Employment or business status is required." };
  }

  if (!addressLine1) {
    return { ok: false, field: "address_line1", error: "Please enter your address." };
  }

  if (!districtCity) {
    return { ok: false, field: "district_city", error: "Please enter your district or city." };
  }

  if (payload.has_collateral && !collateralType) {
    return { ok: false, field: "collateral_type", error: "Please select a collateral type." };
  }

  if (payload.has_collateral && !collateralDescription) {
    return { ok: false, field: "collateral_description", error: "Please describe your collateral." };
  }

  if (
    payload.collateral_estimated_value !== null &&
    payload.collateral_estimated_value !== undefined &&
    !isPositiveNumber(payload.collateral_estimated_value)
  ) {
    return { ok: false, field: "collateral_estimated_value", error: "Collateral value must be greater than 0, or leave blank." };
  }

  if (!payload.consent_granted) {
    return { ok: false, field: "consent_granted", error: "Consent is required before submitting." };
  }

  try {
    const headerStore = headers();
    const userAgent = headerStore.get("user-agent");
    const ipAddress = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const application = await createApplicationFromChat({
      authUserId: currentUser?.id ?? null,
      fullName,
      phone,
      email: email || null,
      requestedAmount: payload.requested_amount,
      requestedTermMonths: payload.requested_term_months,
      loanPurpose,
      monthlyIncome: payload.monthly_income ?? null,
      employmentStatus,
      addressLine1,
      addressLine2: cleanText(payload.address_line2) || null,
      districtCity,
      provinceState: cleanText(payload.province_state) || null,
      postalCode: cleanText(payload.postal_code) || null,
      country: cleanText(payload.country) || "Mongolia",
      hasCollateral: payload.has_collateral,
      collateralType: collateralType || null,
      collateralDescription: collateralDescription || null,
      collateralEstimatedValue: payload.collateral_estimated_value ?? null,
      collateralOwnershipStatus: cleanText(payload.collateral_ownership_status) || null,
      collateralLocation: cleanText(payload.collateral_location) || null,
      documents: payload.documents,
      consentGranted: payload.consent_granted,
      transcript: cleanTranscript(payload.transcript),
      channel: "chat",
      audit: {
        actorType: "customer",
        ipAddress,
        userAgent,
        metadata: {
          source: "chat_apply_route"
        }
      }
    });

    return {
      ok: true,
      applicationId: application.id
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to submit chat application."
    };
  }
}
