import "server-only";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export type IntakeDocumentType =
  | "national_id"
  | "income_proof"
  | "bank_statement"
  | "credit_bureau"
  | "business_registration"
  | "collateral_document"
  | "loan_agreement"
  | "other_statement"
  | "other";

export type IntakeDocumentStatus = "requested" | "uploaded" | "missing";

export type IntakeDocument = {
  type: IntakeDocumentType;
  name: string;
  url?: string;
  status: IntakeDocumentStatus;
};

export type ApplicationCreateInput = {
  authUserId?: string | null;
  fullName: string;
  phone: string;
  email?: string | null;
  requestedAmount: number;
  requestedTermMonths: number;
  loanPurpose: string;
  monthlyIncome?: number | null;
  employmentStatus: string;
  addressLine1: string;
  addressLine2?: string | null;
  districtCity: string;
  provinceState?: string | null;
  postalCode?: string | null;
  country?: string | null;
  hasCollateral: boolean;
  collateralType?: string | null;
  collateralDescription?: string | null;
  collateralEstimatedValue?: number | null;
  collateralOwnershipStatus?: string | null;
  collateralLocation?: string | null;
  documents?: IntakeDocument[];
  consentGranted: boolean;
  channel?: string;
  source?: string | null;
  transcript?: AIConversationMessage[];
  audit?: AuditContext;
};

const documentSchema = z.object({
  type: z.enum([
    "national_id",
    "income_proof",
    "bank_statement",
    "credit_bureau",
    "business_registration",
    "collateral_document",
    "loan_agreement",
    "other_statement",
    "other"
  ]),
  name: z.string().trim().min(1),
  url: z.string().trim().url().optional(),
  status: z.enum(["requested", "uploaded", "missing"])
});

const applicationCreateSchema = z
  .object({
    authUserId: z.string().trim().uuid().nullable().optional(),
    fullName: z.string().trim().min(1, "Full name is required."),
    phone: z.string().trim().min(1, "Phone number is required."),
    email: z.string().trim().email("Enter a valid email address.").nullable().optional().or(z.literal("")),
    requestedAmount: z.number().positive("Requested amount must be greater than 0."),
    requestedTermMonths: z.number().int().positive("Term must be a positive whole number."),
    loanPurpose: z.string().trim().min(1, "Loan purpose is required."),
    monthlyIncome: z.number().positive("Monthly income must be greater than 0.").nullable().optional(),
    employmentStatus: z.string().trim().min(1, "Employment or business status is required."),
    addressLine1: z.string().trim().min(1, "Address line 1 is required."),
    addressLine2: z.string().trim().nullable().optional(),
    districtCity: z.string().trim().min(1, "District / city is required."),
    provinceState: z.string().trim().nullable().optional(),
    postalCode: z.string().trim().nullable().optional(),
    country: z.string().trim().min(1).default("Mongolia"),
    hasCollateral: z.boolean(),
    collateralType: z.string().trim().nullable().optional(),
    collateralDescription: z.string().trim().nullable().optional(),
    collateralEstimatedValue: z.number().positive("Collateral estimated value must be greater than 0.").nullable().optional(),
    collateralOwnershipStatus: z.string().trim().nullable().optional(),
    collateralLocation: z.string().trim().nullable().optional(),
    documents: z.array(documentSchema).default([]),
    consentGranted: z.literal(true, {
      errorMap: () => ({ message: "Consent is required before submitting." })
    }),
    channel: z.string().trim().default("web"),
    source: z.string().trim().nullable().optional(),
    transcript: z.array(z.custom<AIConversationMessage>()).optional(),
    audit: z.custom<AuditContext>().optional()
  })
  .superRefine((value, context) => {
    if (!value.hasCollateral) {
      return;
    }

    if (!value.collateralType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["collateralType"],
        message: "Collateral type is required when collateral is offered."
      });
    }

    if (!value.collateralDescription) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["collateralDescription"],
        message: "Collateral description is required when collateral is offered."
      });
    }
  });

export type Customer = {
  id: string;
  auth_user_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  register_number: string | null;
  customer_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LoanApplication = {
  id: string;
  customer_id: string;
  requested_amount: number;
  requested_term_months: number;
  loan_purpose: string | null;
  monthly_income: number | null;
  employment_status: string | null;
  address_line1: string | null;
  address_line2: string | null;
  district_city: string | null;
  province_state: string | null;
  postal_code: string | null;
  country: string;
  has_collateral: boolean;
  collateral_type: string | null;
  collateral_description: string | null;
  collateral_estimated_value: number | null;
  collateral_ownership_status: string | null;
  collateral_location: string | null;
  documents: IntakeDocument[];
  status: LoanApplicationStatus;
  channel: string;
  source: string | null;
  submitted_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LoanApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "offer_generated"
  | "offer_accepted"
  | "cancelled";

export type Consent = {
  id: string;
  customer_id: string;
  loan_application_id: string | null;
  consent_type: string;
  consent_version: string;
  granted: boolean;
  granted_at: string;
  revoked_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type DocumentRecord = {
  id: string;
  customer_id: string;
  loan_application_id: string | null;
  document_type: string;
  file_path: string;
  file_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DecisionValue = "approved" | "rejected" | "referred" | "counteroffer";

export type Decision = {
  id: string;
  loan_application_id: string;
  customer_id: string;
  decision: DecisionValue;
  decided_by: string;
  decided_by_id: string | null;
  summary: string | null;
  approved_amount: number | null;
  approved_term_months: number | null;
  annual_interest_rate: number | null;
  created_at: string;
};

export type DecisionReason = {
  id: string;
  decision_id: string;
  code: string;
  title: string;
  description: string | null;
  severity: string;
  created_at: string;
};

export type LoanOffer = {
  id: string;
  loan_application_id: string;
  customer_id: string;
  decision_id: string | null;
  amount: number;
  term_months: number;
  annual_interest_rate: number;
  monthly_payment: number | null;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expires_at: string | null;
  accepted_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AIConversationMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
};

export type AIConversation = {
  id: string;
  customer_id: string | null;
  loan_application_id: string | null;
  channel: string;
  title: string | null;
  summary: string | null;
  transcript: AIConversationMessage[];
  extracted_intent: string | null;
  extracted_entities: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AuditEvent = {
  id: string;
  actor_type: string;
  actor_id: string | null;
  object_type: string;
  object_id: string;
  action: string;
  old_value: Json | null;
  new_value: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type AuditContext = {
  actorType?: string;
  actorId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

type SupabaseError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const documentStorageBucket = process.env.OBRAIMS_DOCUMENTS_BUCKET ?? "obraims-documents";
const allowedDocumentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

function maxDocumentUploadBytes() {
  const megabytes = Number(process.env.MAX_UPLOAD_MB ?? "10");
  return Math.max(1, megabytes) * 1024 * 1024;
}

function getServerSupabase() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server configuration is missing. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function fail(operation: string, error: SupabaseError | null) {
  if (!error) {
    return;
  }

  throw new Error(`${operation} failed: ${error.message}${error.details ? ` (${error.details})` : ""}`);
}

function actor(context?: AuditContext) {
  return {
    actorType: context?.actorType ?? "system",
    actorId: context?.actorId ?? null,
    ipAddress: context?.ipAddress ?? null,
    userAgent: context?.userAgent ?? null,
    metadata: context?.metadata ?? {}
  };
}

function auditMetadata(context: AuditContext | undefined, metadata: Record<string, unknown>) {
  return {
    ...(context?.metadata ?? {}),
    ...metadata
  };
}

function safeStorageFileName(fileName: string) {
  const cleaned = fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^_+/, "");
  return cleaned || "document";
}

function validateApplicationDocumentFile(file: File) {
  if (file.size <= 0) {
    throw new Error("The uploaded file is empty.");
  }

  if (file.size > maxDocumentUploadBytes()) {
    throw new Error(`File must not exceed ${Math.round(maxDocumentUploadBytes() / 1024 / 1024)} MB.`);
  }

  if (!allowedDocumentMimeTypes.includes(file.type || "application/octet-stream")) {
    throw new Error("Unsupported file type.");
  }
}

function updateDocumentChecklist(documents: IntakeDocument[], upload: IntakeDocument) {
  const index = documents.findIndex((document) => document.type === upload.type);

  if (index === -1) {
    return [...documents, upload];
  }

  return documents.map((document, currentIndex) =>
    currentIndex === index
      ? {
          ...document,
          name: upload.name,
          status: "uploaded" as const
        }
    : document
  );
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function metadataString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function metadataNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function metadataBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function metadataDocuments(value: unknown): IntakeDocument[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const documents: IntakeDocument[] = [];
  for (const item of value) {
    const parsed = documentSchema.safeParse(item);
    if (parsed.success) {
      documents.push(parsed.data);
    }
  }

  return documents;
}

function intakeMetadata(input: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  districtCity?: string | null;
  provinceState?: string | null;
  postalCode?: string | null;
  country?: string | null;
  hasCollateral?: boolean;
  collateralType?: string | null;
  collateralDescription?: string | null;
  collateralEstimatedValue?: number | null;
  collateralOwnershipStatus?: string | null;
  collateralLocation?: string | null;
  documents?: IntakeDocument[];
}) {
  return {
    intake_version: "simple_core_v1_extended",
    address: {
      address_line1: input.addressLine1 ?? null,
      address_line2: input.addressLine2 ?? null,
      district_city: input.districtCity ?? null,
      province_state: input.provinceState ?? null,
      postal_code: input.postalCode ?? null,
      country: input.country?.trim() || "Mongolia"
    },
    collateral: {
      has_collateral: input.hasCollateral ?? false,
      collateral_type: input.collateralType ?? null,
      collateral_description: input.collateralDescription ?? null,
      collateral_estimated_value: input.collateralEstimatedValue ?? null,
      collateral_ownership_status: input.collateralOwnershipStatus ?? null,
      collateral_location: input.collateralLocation ?? null
    },
    documents: input.documents ?? []
  };
}

function normalizeLoanApplication<T extends { metadata?: Record<string, unknown> | null }>(application: T) {
  const metadata = metadataRecord(application.metadata);
  const address = metadataRecord(metadata.address);
  const collateral = metadataRecord(metadata.collateral);

  return {
    ...application,
    metadata,
    address_line1: metadataString(address.address_line1),
    address_line2: metadataString(address.address_line2),
    district_city: metadataString(address.district_city),
    province_state: metadataString(address.province_state),
    postal_code: metadataString(address.postal_code),
    country: metadataString(address.country) ?? "Mongolia",
    has_collateral: metadataBoolean(collateral.has_collateral),
    collateral_type: metadataString(collateral.collateral_type),
    collateral_description: metadataString(collateral.collateral_description),
    collateral_estimated_value: metadataNumber(collateral.collateral_estimated_value),
    collateral_ownership_status: metadataString(collateral.collateral_ownership_status),
    collateral_location: metadataString(collateral.collateral_location),
    documents: metadataDocuments(metadata.documents)
  };
}

export async function recordAuditEvent(input: {
  actorType: string;
  actorId?: string | null;
  objectType: string;
  objectId: string;
  action: string;
  oldValue?: Json | null;
  newValue?: Json | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("audit_events")
    .insert({
      actor_type: input.actorType,
      actor_id: input.actorId ?? null,
      object_type: input.objectType,
      object_id: input.objectId,
      action: input.action,
      old_value: input.oldValue ?? null,
      new_value: input.newValue ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      metadata: input.metadata ?? {}
    })
    .select()
    .single();

  fail("Recording audit event", error);
  return data as AuditEvent;
}

export async function getOrCreateCustomer(input: {
  authUserId?: string | null;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  registerNumber?: string | null;
  customerType?: "individual" | "business";
  metadata?: Record<string, unknown>;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  const cleanedEmail = input.email?.trim().toLowerCase() || null;
  const cleanedPhone = input.phone?.trim() || null;
  const cleanedRegisterNumber = input.registerNumber?.trim() || null;
  const filters = [
    input.authUserId ? `auth_user_id.eq.${input.authUserId}` : "",
    cleanedEmail ? `email.eq.${cleanedEmail}` : "",
    cleanedPhone ? `phone.eq.${cleanedPhone}` : "",
    cleanedRegisterNumber ? `register_number.eq.${cleanedRegisterNumber}` : ""
  ].filter(Boolean);

  if (filters.length > 0) {
    const { data: existing, error } = await supabase
      .from("customers")
      .select()
      .or(filters.join(","))
      .limit(1)
      .maybeSingle();

    fail("Finding customer", error);

    if (existing) {
      let customer = existing as Customer;

      if (input.authUserId && !customer.auth_user_id) {
        const { data: linkedCustomer, error: linkError } = await supabase
          .from("customers")
          .update({ auth_user_id: input.authUserId })
          .eq("id", customer.id)
          .select()
          .single();

        fail("Linking customer to authenticated user", linkError);

        await recordAuditEvent({
          ...actor(input.audit),
          objectType: "customer",
          objectId: customer.id,
          action: "customer.auth_user_linked",
          oldValue: customer,
          newValue: linkedCustomer as Json
        });

        customer = linkedCustomer as Customer;
      }

      await recordAuditEvent({
        ...actor(input.audit),
        objectType: "customer",
        objectId: customer.id,
        action: "customer.reused",
        newValue: customer
      });
      return customer;
    }
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      auth_user_id: input.authUserId ?? null,
      full_name: input.fullName?.trim() || null,
      phone: cleanedPhone,
      email: cleanedEmail,
      register_number: cleanedRegisterNumber,
      customer_type: input.customerType ?? "individual",
      metadata: input.metadata ?? {}
    })
    .select()
    .single();

  fail("Creating customer", error);
  const customer = data as Customer;
  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "customer",
    objectId: customer.id,
    action: "customer.created",
    newValue: customer
  });
  return customer;
}

export async function createLoanApplication(input: {
  customerId: string;
  requestedAmount: number;
  requestedTermMonths: number;
  loanPurpose?: string | null;
  monthlyIncome?: number | null;
  employmentStatus?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  districtCity?: string | null;
  provinceState?: string | null;
  postalCode?: string | null;
  country?: string | null;
  hasCollateral?: boolean;
  collateralType?: string | null;
  collateralDescription?: string | null;
  collateralEstimatedValue?: number | null;
  collateralOwnershipStatus?: string | null;
  collateralLocation?: string | null;
  documents?: IntakeDocument[];
  channel?: string;
  source?: string | null;
  metadata?: Record<string, unknown>;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("loan_applications")
    .insert({
      customer_id: input.customerId,
      requested_amount: input.requestedAmount,
      requested_term_months: input.requestedTermMonths,
      loan_purpose: input.loanPurpose ?? null,
      monthly_income: input.monthlyIncome ?? null,
      employment_status: input.employmentStatus ?? null,
      channel: input.channel ?? "web",
      source: input.source ?? null,
      metadata: {
        ...(input.metadata ?? {}),
        ...intakeMetadata(input)
      }
    })
    .select()
    .single();

  fail("Creating loan application", error);
  const application = normalizeLoanApplication(data as LoanApplication) as LoanApplication;
  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "loan_application",
    objectId: application.id,
    action: "loan_application.created",
    newValue: application,
    metadata: auditMetadata(input.audit, {
      loan_application_id: application.id,
      customer_id: application.customer_id
    })
  });
  return application;
}

function normalizedDocuments(input: ApplicationCreateInput, parsedDocuments: IntakeDocument[]) {
  const lowerPurpose = input.loanPurpose.toLowerCase();
  const lowerStatus = input.employmentStatus.toLowerCase();
  const isBusinessApplicant =
    lowerPurpose.includes("business") ||
    lowerPurpose.includes("sme") ||
    lowerPurpose.includes("inventory") ||
    lowerStatus.includes("business") ||
    lowerStatus.includes("self-employed");
  const required: IntakeDocument[] = [
    { type: "national_id", name: "National ID", status: "requested" },
    { type: "income_proof", name: "Income proof or salary/business revenue proof", status: "requested" },
    { type: "bank_statement", name: "Bank statement", status: "requested" },
    { type: "credit_bureau", name: "Credit bureau report", status: "requested" },
    { type: "loan_agreement", name: "Other loan agreement", status: "requested" },
    { type: "other_statement", name: "Other loan or account statement", status: "requested" }
  ];

  if (input.hasCollateral) {
    required.push({ type: "collateral_document", name: "Collateral ownership or valuation document", status: "requested" });
  }

  if (isBusinessApplicant) {
    required.push({ type: "business_registration", name: "Business registration", status: "requested" });
  }

  const byType = new Map<IntakeDocumentType, IntakeDocument>();
  for (const document of required) {
    byType.set(document.type, document);
  }

  for (const document of parsedDocuments) {
    byType.set(document.type, {
      ...document,
      name: document.name.trim()
    });
  }

  return [...byType.values()];
}

export async function createApplication(input: ApplicationCreateInput) {
  const parsed = applicationCreateSchema.parse(input);
  const source = parsed.source || (parsed.channel === "chat" ? "chat_intake" : "traditional_form");
  const audit = {
    ...parsed.audit,
    actorType: parsed.audit?.actorType ?? "customer",
    metadata: auditMetadata(parsed.audit, {
      source
    })
  };
  const documents = normalizedDocuments(
    {
      ...input,
      loanPurpose: parsed.loanPurpose,
      employmentStatus: parsed.employmentStatus,
      hasCollateral: parsed.hasCollateral
    },
    parsed.documents
  );

  const customer = await getOrCreateCustomer({
    authUserId: parsed.authUserId ?? null,
    fullName: parsed.fullName,
    phone: parsed.phone,
    email: parsed.email || null,
    metadata: {
      address: {
        address_line1: parsed.addressLine1,
        address_line2: parsed.addressLine2 || null,
        district_city: parsed.districtCity,
        province_state: parsed.provinceState || null,
        postal_code: parsed.postalCode || null,
        country: parsed.country
      }
    },
    audit
  });

  const conversation =
    parsed.channel === "chat"
      ? await createAIConversation({
          customerId: customer.id,
          loanApplicationId: null,
          channel: "chat",
          title: "Loan application intake",
          summary: "Guided chat-based loan application capture.",
          transcript: parsed.transcript ?? [],
          extractedIntent: "loan_application",
          extractedEntities: {
            full_name: parsed.fullName,
            phone: parsed.phone,
            email: parsed.email || null,
            requested_amount: parsed.requestedAmount,
            requested_term_months: parsed.requestedTermMonths,
            loan_purpose: parsed.loanPurpose,
            monthly_income: parsed.monthlyIncome ?? null,
            employment_status: parsed.employmentStatus,
            address_line1: parsed.addressLine1,
            address_line2: parsed.addressLine2 || null,
            district_city: parsed.districtCity,
            province_state: parsed.provinceState || null,
            postal_code: parsed.postalCode || null,
            country: parsed.country,
            has_collateral: parsed.hasCollateral,
            collateral_type: parsed.collateralType || null,
            collateral_estimated_value: parsed.collateralEstimatedValue ?? null,
            documents
          },
          audit: {
            ...audit,
            actorId: customer.id,
            metadata: auditMetadata(audit, {
              customer_id: customer.id
            })
          }
        })
      : null;

  const application = await createLoanApplication({
    customerId: customer.id,
    requestedAmount: parsed.requestedAmount,
    requestedTermMonths: parsed.requestedTermMonths,
    loanPurpose: parsed.loanPurpose,
    monthlyIncome: parsed.monthlyIncome ?? null,
    employmentStatus: parsed.employmentStatus,
    addressLine1: parsed.addressLine1,
    addressLine2: parsed.addressLine2 || null,
    districtCity: parsed.districtCity,
    provinceState: parsed.provinceState || null,
    postalCode: parsed.postalCode || null,
    country: parsed.country,
    hasCollateral: parsed.hasCollateral,
    collateralType: parsed.hasCollateral ? parsed.collateralType || null : null,
    collateralDescription: parsed.hasCollateral ? parsed.collateralDescription || null : null,
    collateralEstimatedValue: parsed.hasCollateral ? parsed.collateralEstimatedValue ?? null : null,
    collateralOwnershipStatus: parsed.hasCollateral ? parsed.collateralOwnershipStatus || null : null,
    collateralLocation: parsed.hasCollateral ? parsed.collateralLocation || null : null,
    documents,
    channel: parsed.channel,
    source,
    metadata: {
      conversation_id: conversation?.id ?? null
    },
    audit: {
      ...audit,
      actorId: customer.id,
      metadata: auditMetadata(audit, {
        customer_id: customer.id,
        conversation_id: conversation?.id ?? null,
        loan_application_id: "pending"
      })
    }
  });

  await grantConsent({
    customerId: customer.id,
    loanApplicationId: application.id,
    consentType: "loan_application_processing",
    metadata: {
      source
    },
    ipAddress: parsed.audit?.ipAddress ?? null,
    userAgent: parsed.audit?.userAgent ?? null,
    audit: {
      ...audit,
      actorId: customer.id,
      metadata: auditMetadata(audit, {
        customer_id: customer.id,
        conversation_id: conversation?.id ?? null,
        loan_application_id: application.id
      })
    }
  });

  const submittedApplication = await submitLoanApplication({
    loanApplicationId: application.id,
    audit: {
      ...audit,
      actorId: customer.id,
      metadata: auditMetadata(audit, {
        customer_id: customer.id,
        conversation_id: conversation?.id ?? null,
        loan_application_id: application.id
      })
    }
  });

  if (conversation) {
    const supabase = getServerSupabase();
    const { data: linkedConversation, error: linkError } = await supabase
      .from("ai_conversations")
      .update({
        loan_application_id: application.id
      })
      .eq("id", conversation.id)
      .select()
      .single();

    fail("Linking AI conversation to application", linkError);

    await recordAuditEvent({
      ...actor(audit),
      actorId: customer.id,
      objectType: "ai_conversation",
      objectId: conversation.id,
      action: "ai_conversation.linked_to_application",
      oldValue: conversation,
      newValue: linkedConversation as Json,
      metadata: auditMetadata(audit, {
        customer_id: customer.id,
        loan_application_id: application.id,
        conversation_id: conversation.id
      })
    });
  }

  await recordAuditEvent({
    ...actor(audit),
    actorId: customer.id,
    objectType: "loan_application",
    objectId: application.id,
    action: "application.created",
    newValue: submittedApplication,
    metadata: auditMetadata(audit, {
      customer_id: customer.id,
      loan_application_id: application.id,
      conversation_id: conversation?.id ?? null,
      source
    })
  });

  return submittedApplication;
}

export async function submitLoanApplication(input: {
  loanApplicationId: string;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  const { data: previous, error: readError } = await supabase
    .from("loan_applications")
    .select()
    .eq("id", input.loanApplicationId)
    .single();

  fail("Reading loan application before submit", readError);

  const { data, error } = await supabase
    .from("loan_applications")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString()
    })
    .eq("id", input.loanApplicationId)
    .select()
    .single();

  fail("Submitting loan application", error);
  const application = normalizeLoanApplication(data as LoanApplication) as LoanApplication;
  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "loan_application",
    objectId: application.id,
    action: "loan_application.submitted",
    oldValue: normalizeLoanApplication(previous as LoanApplication) as Json,
    newValue: application,
    metadata: auditMetadata(input.audit, {
      loan_application_id: application.id,
      customer_id: application.customer_id
    })
  });
  return application;
}

export async function grantConsent(input: {
  customerId: string;
  loanApplicationId?: string | null;
  consentType: string;
  consentVersion?: string;
  granted?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("consents")
    .insert({
      customer_id: input.customerId,
      loan_application_id: input.loanApplicationId ?? null,
      consent_type: input.consentType,
      consent_version: input.consentVersion ?? "v1",
      granted: input.granted ?? true,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      metadata: input.metadata ?? {}
    })
    .select()
    .single();

  fail("Granting consent", error);
  const consent = data as Consent;
  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "consent",
    objectId: consent.id,
    action: "consent.granted",
    newValue: consent,
    ipAddress: input.ipAddress ?? input.audit?.ipAddress ?? null,
    userAgent: input.userAgent ?? input.audit?.userAgent ?? null,
    metadata: auditMetadata(input.audit, {
      customer_id: consent.customer_id,
      loan_application_id: consent.loan_application_id,
      consent_type: consent.consent_type
    })
  });
  return consent;
}

export async function addDocumentRecord(input: {
  customerId: string;
  loanApplicationId?: string | null;
  documentType: string;
  filePath: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  status?: string;
  metadata?: Record<string, unknown>;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      customer_id: input.customerId,
      loan_application_id: input.loanApplicationId ?? null,
      document_type: input.documentType,
      file_path: input.filePath,
      file_name: input.fileName ?? null,
      mime_type: input.mimeType ?? null,
      file_size_bytes: input.fileSizeBytes ?? null,
      status: input.status ?? "uploaded",
      metadata: input.metadata ?? {}
    })
    .select()
    .single();

  fail("Adding document record", error);
  const document = data as DocumentRecord;
  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "document",
    objectId: document.id,
    action: "document.created",
    newValue: document
  });
  return document;
}

export async function listDocumentRecordsForApplication(loanApplicationId: string) {
  noStore();
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("documents")
    .select()
    .eq("loan_application_id", loanApplicationId)
    .order("created_at", { ascending: false });

  fail("Listing application document records", error);
  return (data ?? []) as DocumentRecord[];
}

export async function getDocumentRecordForApplication(input: {
  loanApplicationId: string;
  documentId: string;
}) {
  noStore();
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("documents")
    .select()
    .eq("id", input.documentId)
    .eq("loan_application_id", input.loanApplicationId)
    .maybeSingle();

  fail("Loading application document record", error);
  return data ? (data as DocumentRecord) : null;
}

export async function createSignedDocumentUrl(input: {
  loanApplicationId: string;
  documentId: string;
  expiresInSeconds?: number;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  const document = await getDocumentRecordForApplication(input);

  if (!document) {
    return null;
  }

  const expiresInSeconds = Math.min(Math.max(input.expiresInSeconds ?? 60, 1), 300);
  const { data, error } = await supabase.storage
    .from(documentStorageBucket)
    .createSignedUrl(document.file_path, expiresInSeconds);

  fail("Creating signed document URL", error);

  if (!data?.signedUrl) {
    throw new Error("Creating signed document URL failed: no signed URL returned.");
  }

  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "document",
    objectId: document.id,
    action: "document.signed_url.created",
    metadata: auditMetadata(input.audit, {
      loan_application_id: input.loanApplicationId,
      customer_id: document.customer_id,
      document_id: document.id,
      document_type: document.document_type,
      expires_in_seconds: expiresInSeconds
    })
  });

  return {
    document,
    signedUrl: data.signedUrl,
    expiresInSeconds
  };
}

export async function uploadApplicationDocument(input: {
  loanApplicationId: string;
  documentType: IntakeDocumentType;
  file: File;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  validateApplicationDocumentFile(input.file);

  const { data: applicationData, error: applicationError } = await supabase
    .from("loan_applications")
    .select()
    .eq("id", input.loanApplicationId)
    .single();

  fail("Loading loan application for document upload", applicationError);
  const application = normalizeLoanApplication(applicationData as LoanApplication) as LoanApplication;
  const safeName = `${randomUUID()}-${safeStorageFileName(input.file.name)}`;
  const storagePath = `${application.id}/${input.documentType}/${safeName}`;
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(documentStorageBucket)
    .upload(storagePath, bytes, {
      cacheControl: "3600",
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
      metadata: {
        loan_application_id: application.id,
        customer_id: application.customer_id,
        document_type: input.documentType,
        original_file_name: input.file.name
      }
    });

  fail("Uploading document to storage", uploadError);

  const document = await addDocumentRecord({
    customerId: application.customer_id,
    loanApplicationId: application.id,
    documentType: input.documentType,
    filePath: storagePath,
    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    fileSizeBytes: input.file.size,
    status: "uploaded",
    metadata: {
      bucket: documentStorageBucket,
      storage_path: storagePath
    },
    audit: input.audit
  });
  const nextDocuments = updateDocumentChecklist(application.documents ?? [], {
    type: input.documentType,
    name: input.file.name,
    status: "uploaded"
  });
  const { data: updatedApplication, error: updateError } = await supabase
    .from("loan_applications")
    .update({
      metadata: {
        ...(application.metadata ?? {}),
        documents: nextDocuments
      }
    })
    .eq("id", application.id)
    .select()
    .single();

  fail("Updating application document checklist", updateError);

  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "loan_application",
    objectId: application.id,
    action: "loan_application.documents_updated",
      oldValue: application,
      newValue: normalizeLoanApplication(updatedApplication as LoanApplication) as Json,
    metadata: auditMetadata(input.audit, {
      loan_application_id: application.id,
      customer_id: application.customer_id,
      document_id: document.id,
      document_type: input.documentType,
      bucket: documentStorageBucket,
      storage_path: storagePath
    })
  });

  return {
    document,
    application: normalizeLoanApplication(updatedApplication as LoanApplication) as LoanApplication
  };
}

export async function saveCreditMemo(input: {
  loanApplicationId: string;
  creditMemo: Record<string, unknown>;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  const { data: previous, error: readError } = await supabase
    .from("loan_applications")
    .select()
    .eq("id", input.loanApplicationId)
    .single();

  fail("Loading loan application for credit memo", readError);
  const previousApplication = normalizeLoanApplication(previous as LoanApplication) as LoanApplication;
  const nextMetadata = {
    ...(previousApplication.metadata ?? {}),
    credit_memo: input.creditMemo
  };
  const { data, error } = await supabase
    .from("loan_applications")
    .update({
      metadata: nextMetadata
    })
    .eq("id", input.loanApplicationId)
    .select()
    .single();

  fail("Saving credit memo", error);
  const application = normalizeLoanApplication(data as LoanApplication) as LoanApplication;
  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "loan_application",
    objectId: application.id,
    action: "credit_memo.generated",
    oldValue: previousApplication as Json,
    newValue: application as Json,
    metadata: auditMetadata(input.audit, {
      loan_application_id: application.id,
      customer_id: application.customer_id
    })
  });

  return application;
}

export async function createDecision(input: {
  loanApplicationId: string;
  customerId: string;
  decision: DecisionValue;
  decidedBy?: string;
  decidedById?: string | null;
  summary?: string | null;
  approvedAmount?: number | null;
  approvedTermMonths?: number | null;
  annualInterestRate?: number | null;
  reasons?: Array<{
    code: string;
    title: string;
    description?: string | null;
    severity?: string;
  }>;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("decisions")
    .insert({
      loan_application_id: input.loanApplicationId,
      customer_id: input.customerId,
      decision: input.decision,
      decided_by: input.decidedBy ?? "system",
      decided_by_id: input.decidedById ?? null,
      summary: input.summary ?? null,
      approved_amount: input.approvedAmount ?? null,
      approved_term_months: input.approvedTermMonths ?? null,
      annual_interest_rate: input.annualInterestRate ?? null
    })
    .select()
    .single();

  fail("Creating decision", error);
  const decision = data as Decision;
  let createdReasons: DecisionReason[] = [];

  if (input.reasons?.length) {
    const { data: reasons, error: reasonsError } = await supabase
      .from("decision_reasons")
      .insert(
        input.reasons.map((reason) => ({
          decision_id: decision.id,
          code: reason.code,
          title: reason.title,
          description: reason.description ?? null,
          severity: reason.severity ?? "info"
        }))
      )
      .select();
    fail("Creating decision reasons", reasonsError);
    createdReasons = (reasons ?? []) as DecisionReason[];
  }

  const { data: previousApplication, error: readApplicationError } = await supabase
    .from("loan_applications")
    .select()
    .eq("id", input.loanApplicationId)
    .single();

  fail("Reading application before decision status update", readApplicationError);

  const status: LoanApplicationStatus = input.decision === "approved" || input.decision === "counteroffer" ? "approved" : input.decision === "rejected" ? "rejected" : "under_review";
  const { data: updatedApplication, error: statusError } = await supabase
    .from("loan_applications")
    .update({ status })
    .eq("id", input.loanApplicationId)
    .select()
    .single();

  fail("Updating application status after decision", statusError);

  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "decision",
    objectId: decision.id,
    action: "decision.created",
    newValue: {
      ...decision,
      reasons: input.reasons ?? []
    },
    metadata: auditMetadata(input.audit, {
      loan_application_id: decision.loan_application_id,
      customer_id: decision.customer_id,
      decision_id: decision.id
    })
  });

  for (const reason of createdReasons) {
    await recordAuditEvent({
      ...actor(input.audit),
      objectType: "decision_reasons",
      objectId: reason.id,
      action: "decision_reason.created",
      newValue: reason,
      metadata: auditMetadata(input.audit, {
        decision_id: decision.id,
        loan_application_id: decision.loan_application_id,
        customer_id: decision.customer_id
      })
    });
  }

  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "loan_application",
    objectId: input.loanApplicationId,
    action: "loan_application.status_updated",
    oldValue: previousApplication as Json,
    newValue: updatedApplication as Json,
    metadata: auditMetadata(input.audit, {
      loan_application_id: input.loanApplicationId,
      customer_id: input.customerId,
      decision_id: decision.id,
      status
    })
  });
  return decision;
}

export async function createLoanOffer(input: {
  loanApplicationId: string;
  customerId: string;
  decisionId?: string | null;
  amount: number;
  termMonths: number;
  annualInterestRate: number;
  monthlyPayment?: number | null;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("loan_offers")
    .insert({
      loan_application_id: input.loanApplicationId,
      customer_id: input.customerId,
      decision_id: input.decisionId ?? null,
      amount: input.amount,
      term_months: input.termMonths,
      annual_interest_rate: input.annualInterestRate,
      monthly_payment: input.monthlyPayment ?? null,
      expires_at: input.expiresAt ?? null,
      metadata: input.metadata ?? {}
    })
    .select()
    .single();

  fail("Creating loan offer", error);
  const offer = data as LoanOffer;

  const { data: previousApplication, error: readApplicationError } = await supabase
    .from("loan_applications")
    .select()
    .eq("id", input.loanApplicationId)
    .single();

  fail("Reading application before offer status update", readApplicationError);

  const { data: updatedApplication, error: statusError } = await supabase
    .from("loan_applications")
    .update({ status: "offer_generated" })
    .eq("id", input.loanApplicationId)
    .select()
    .single();

  fail("Updating application status after offer", statusError);

  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "loan_offer",
    objectId: offer.id,
    action: "loan_offer.created",
    newValue: offer,
    metadata: auditMetadata(input.audit, {
      loan_application_id: offer.loan_application_id,
      customer_id: offer.customer_id,
      decision_id: offer.decision_id,
      loan_offer_id: offer.id
    })
  });

  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "loan_application",
    objectId: input.loanApplicationId,
    action: "loan_application.status_updated",
    oldValue: previousApplication as Json,
    newValue: updatedApplication as Json,
    metadata: auditMetadata(input.audit, {
      loan_application_id: input.loanApplicationId,
      customer_id: input.customerId,
      loan_offer_id: offer.id,
      status: "offer_generated"
    })
  });
  return offer;
}

export async function acceptLoanOffer(input: {
  loanOfferId: string;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  const { data: previous, error: readError } = await supabase
    .from("loan_offers")
    .select()
    .eq("id", input.loanOfferId)
    .single();

  fail("Reading loan offer before accept", readError);

  const { data, error } = await supabase
    .from("loan_offers")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString()
    })
    .eq("id", input.loanOfferId)
    .select()
    .single();

  fail("Accepting loan offer", error);
  const offer = data as LoanOffer;

  const { data: previousApplication, error: readApplicationError } = await supabase
    .from("loan_applications")
    .select()
    .eq("id", offer.loan_application_id)
    .single();

  fail("Reading application before offer acceptance status update", readApplicationError);

  const { data: updatedApplication, error: statusError } = await supabase
    .from("loan_applications")
    .update({ status: "offer_accepted" })
    .eq("id", offer.loan_application_id)
    .select()
    .single();

  fail("Updating application status after offer acceptance", statusError);

  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "loan_offer",
    objectId: offer.id,
    action: "loan_offer.accepted",
    oldValue: previous as Json,
    newValue: offer,
    metadata: auditMetadata(input.audit, {
      loan_application_id: offer.loan_application_id,
      customer_id: offer.customer_id,
      loan_offer_id: offer.id
    })
  });

  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "loan_application",
    objectId: offer.loan_application_id,
    action: "loan_application.status_updated",
    oldValue: previousApplication as Json,
    newValue: updatedApplication as Json,
    metadata: auditMetadata(input.audit, {
      loan_application_id: offer.loan_application_id,
      customer_id: offer.customer_id,
      loan_offer_id: offer.id,
      status: "offer_accepted"
    })
  });
  return offer;
}

export async function createAIConversation(input: {
  customerId?: string | null;
  loanApplicationId?: string | null;
  channel?: string;
  title?: string | null;
  summary?: string | null;
  transcript?: AIConversationMessage[];
  extractedIntent?: string | null;
  extractedEntities?: Record<string, unknown>;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      customer_id: input.customerId ?? null,
      loan_application_id: input.loanApplicationId ?? null,
      channel: input.channel ?? "web",
      title: input.title ?? null,
      summary: input.summary ?? null,
      transcript: input.transcript ?? [],
      extracted_intent: input.extractedIntent ?? null,
      extracted_entities: input.extractedEntities ?? {}
    })
    .select()
    .single();

  fail("Creating AI conversation", error);
  const conversation = data as AIConversation;
  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "ai_conversation",
    objectId: conversation.id,
    action: "ai_conversation.created",
    newValue: conversation
  });
  return conversation;
}

export async function appendAIConversationMessage(input: {
  conversationId: string;
  message: AIConversationMessage;
  audit?: AuditContext;
}) {
  const supabase = getServerSupabase();
  const { data: previous, error: readError } = await supabase
    .from("ai_conversations")
    .select()
    .eq("id", input.conversationId)
    .single();

  fail("Reading AI conversation", readError);

  const conversation = previous as AIConversation;
  const transcript = Array.isArray(conversation.transcript) ? conversation.transcript : [];
  const nextTranscript = [
    ...transcript,
    {
      ...input.message,
      created_at: input.message.created_at ?? new Date().toISOString()
    }
  ];

  const { data, error } = await supabase
    .from("ai_conversations")
    .update({ transcript: nextTranscript })
    .eq("id", input.conversationId)
    .select()
    .single();

  fail("Appending AI conversation message", error);
  const updated = data as AIConversation;
  await recordAuditEvent({
    ...actor(input.audit),
    objectType: "ai_conversation",
    objectId: updated.id,
    action: "ai_conversation.message_appended",
    oldValue: conversation,
    newValue: updated
  });
  return updated;
}

export async function createApplicationFromChat(input: {
  authUserId?: string | null;
  fullName: string;
  phone: string;
  email?: string | null;
  requestedAmount: number;
  requestedTermMonths: number;
  loanPurpose?: string | null;
  monthlyIncome?: number | null;
  employmentStatus?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  districtCity: string;
  provinceState?: string | null;
  postalCode?: string | null;
  country?: string | null;
  hasCollateral: boolean;
  collateralType?: string | null;
  collateralDescription?: string | null;
  collateralEstimatedValue?: number | null;
  collateralOwnershipStatus?: string | null;
  collateralLocation?: string | null;
  documents?: IntakeDocument[];
  consentGranted: boolean;
  transcript?: AIConversationMessage[];
  channel?: string;
  audit?: AuditContext;
}) {
  return createApplication({
    authUserId: input.authUserId ?? null,
    fullName: input.fullName,
    phone: input.phone,
    email: input.email ?? null,
    requestedAmount: input.requestedAmount,
    requestedTermMonths: input.requestedTermMonths,
    loanPurpose: input.loanPurpose ?? "",
    monthlyIncome: input.monthlyIncome ?? null,
    employmentStatus: input.employmentStatus ?? "",
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 ?? null,
    districtCity: input.districtCity,
    provinceState: input.provinceState ?? null,
    postalCode: input.postalCode ?? null,
    country: input.country ?? "Mongolia",
    hasCollateral: input.hasCollateral,
    collateralType: input.collateralType ?? null,
    collateralDescription: input.collateralDescription ?? null,
    collateralEstimatedValue: input.collateralEstimatedValue ?? null,
    collateralOwnershipStatus: input.collateralOwnershipStatus ?? null,
    collateralLocation: input.collateralLocation ?? null,
    documents: input.documents ?? [],
    consentGranted: input.consentGranted,
    transcript: input.transcript ?? [],
    channel: input.channel ?? "chat",
    source: "chat_intake",
    audit: {
      ...input.audit,
      actorType: input.audit?.actorType ?? "ai_agent",
      metadata: auditMetadata(input.audit, {
        source: "chat_intake"
      })
    }
  });
}

export async function listAuditEventsForApplication(loanApplicationId: string) {
  noStore();
  const supabase = getServerSupabase();
  const [directResult, metadataResult] = await Promise.all([
    supabase
      .from("audit_events")
      .select()
      .eq("object_id", loanApplicationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_events")
      .select()
      .contains("metadata", { loan_application_id: loanApplicationId })
      .order("created_at", { ascending: false })
  ]);

  fail("Listing direct application audit events", directResult.error);
  fail("Listing related application audit events", metadataResult.error);

  const eventsById = new Map<string, AuditEvent>();
  for (const event of [...(directResult.data ?? []), ...(metadataResult.data ?? [])]) {
    const auditEvent = event as AuditEvent;
    eventsById.set(auditEvent.id, auditEvent);
  }

  return [...eventsById.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getLoanApplicationDetail(id: string) {
  noStore();
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("loan_applications")
    .select("*, customer:customers(*), decisions(*, decision_reasons(*)), loan_offers(*)")
    .eq("id", id)
    .single();

  fail("Loading loan application", error);
  return normalizeLoanApplication(data as LoanApplication) as LoanApplication & {
    customer: Customer;
    decisions: Array<Decision & { decision_reasons: DecisionReason[] }>;
    loan_offers: LoanOffer[];
  };
}

export async function listLoanApplicationsForAdmin() {
  noStore();
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("loan_applications")
    .select("*, customer:customers(*), decisions(*, decision_reasons(*)), loan_offers(*)")
    .order("created_at", { ascending: false });

  fail("Listing loan applications", error);
  return (data ?? []).map((application) => normalizeLoanApplication(application as LoanApplication)) as Array<
    LoanApplication & {
      customer: Customer;
      decisions: Array<Decision & { decision_reasons: DecisionReason[] }>;
      loan_offers: LoanOffer[];
    }
  >;
}

export async function listLoanApplicationsForCustomerEmail(email: string) {
  noStore();
  const cleanedEmail = email.trim().toLowerCase();

  if (!cleanedEmail) {
    return [];
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("loan_applications")
    .select("*, customer:customers!inner(*), decisions(*, decision_reasons(*)), loan_offers(*)")
    .eq("customer.email", cleanedEmail)
    .order("created_at", { ascending: false });

  fail("Listing borrower loan applications", error);
  return (data ?? []).map((application) => normalizeLoanApplication(application as LoanApplication)) as Array<
    LoanApplication & {
      customer: Customer;
      decisions: Array<Decision & { decision_reasons: DecisionReason[] }>;
      loan_offers: LoanOffer[];
    }
  >;
}
