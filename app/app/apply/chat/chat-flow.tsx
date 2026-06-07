"use client";

import { useMemo, useState, useTransition } from "react";
import { submitChatApplication, type ChatApplicationPayload } from "./actions";
import type { AIConversationMessage, IntakeDocument, IntakeDocumentType } from "@/src/lib/obraims/simple-core";

type Answers = {
  full_name: string;
  phone: string;
  email: string;
  requested_amount: string;
  requested_term_months: string;
  loan_purpose: string;
  monthly_income: string;
  employment_status: string;
  address_line1: string;
  address_line2: string;
  district_city: string;
  province_state: string;
  postal_code: string;
  country: string;
  has_collateral: boolean | null;
  collateral_type: string;
  collateral_description: string;
  collateral_estimated_value: string;
  collateral_ownership_status: string;
  collateral_location: string;
  document_response: string;
  consent_granted: boolean | null;
};

type StepKey = keyof Answers;
type StepGroup = "Basic info" | "Loan" | "Financials" | "Address" | "Collateral" | "Documents" | "Review" | "Submitted";
type ChatMessage = {
  role: "assistant" | "user";
  content: string;
  created_at: string;
};

const groups: StepGroup[] = ["Basic info", "Loan", "Financials", "Address", "Collateral", "Documents", "Review", "Submitted"];
const groupLabels: Record<StepGroup, string> = {
  "Basic info": "Basic info",
  Loan: "Loan",
  Financials: "Financials",
  Address: "Address",
  Collateral: "Collateral",
  Documents: "Documents",
  Review: "Review",
  Submitted: "Submitted"
};

const answerSteps: Array<{
  key: StepKey;
  group: StepGroup;
  label: string;
  prompt: string;
  placeholder?: string;
  optional?: boolean;
  collateralOnly?: boolean;
}> = [
  { key: "full_name", group: "Basic info", label: "Full name", prompt: "First, what is your full name?", placeholder: "Example: Battulga Bold" },
  { key: "phone", group: "Basic info", label: "Phone", prompt: "What phone number should we use for this loan request?", placeholder: "Example: 99112233" },
  { key: "email", group: "Basic info", label: "Email", prompt: "What email should we use for status tracking?", placeholder: "borrower@example.com" },
  { key: "requested_amount", group: "Loan", label: "Requested amount", prompt: "How much would you like to borrow?", placeholder: "Example: 1000000" },
  { key: "requested_term_months", group: "Loan", label: "Requested term", prompt: "How many months would you like for the loan term?", placeholder: "Example: 12" },
  { key: "loan_purpose", group: "Loan", label: "Loan purpose", prompt: "What will the loan be used for?", placeholder: "Example: Inventory purchase" },
  { key: "employment_status", group: "Financials", label: "Employment or business status", prompt: "Which employment or business status best describes you?" },
  { key: "monthly_income", group: "Financials", label: "Monthly income", prompt: "What is your monthly income or monthly business revenue?", placeholder: "Example: 500000" },
  { key: "address_line1", group: "Address", label: "Address line 1", prompt: "What is your main street, building, or home address?", placeholder: "Example: Peace Avenue 12-34" },
  { key: "address_line2", group: "Address", label: "Address line 2", prompt: "Any apartment, entrance, or floor details? Type skip if not applicable.", placeholder: "Example: Apt 8 or skip", optional: true },
  { key: "district_city", group: "Address", label: "District / city", prompt: "Which district or city are you in?", placeholder: "Example: Bayanzurkh, Ulaanbaatar" },
  { key: "province_state", group: "Address", label: "Province / state", prompt: "Which province or state? Type skip if not applicable.", placeholder: "Example: Ulaanbaatar or skip", optional: true },
  { key: "postal_code", group: "Address", label: "Postal code", prompt: "What is your postal code? Type skip if you do not know it.", placeholder: "Example: 13381 or skip", optional: true },
  { key: "country", group: "Address", label: "Country", prompt: "Country is set to Mongolia. Press send if that is correct, or type another country.", placeholder: "Mongolia", optional: true },
  { key: "has_collateral", group: "Collateral", label: "Collateral", prompt: "Would you like to offer collateral for this application?" },
  { key: "collateral_type", group: "Collateral", label: "Collateral type", prompt: "What type of collateral is it?", collateralOnly: true },
  { key: "collateral_description", group: "Collateral", label: "Collateral description", prompt: "Please briefly describe the collateral.", placeholder: "Example: 2018 Toyota Prius, apartment, land certificate", collateralOnly: true },
  { key: "collateral_estimated_value", group: "Collateral", label: "Estimated collateral value", prompt: "What is the estimated collateral value? Type skip if unknown.", placeholder: "Example: 25000000 or skip", optional: true, collateralOnly: true },
  { key: "collateral_ownership_status", group: "Collateral", label: "Ownership status", prompt: "What is the ownership status?", placeholder: "Owned, jointly owned, financed", collateralOnly: true },
  { key: "collateral_location", group: "Collateral", label: "Collateral location", prompt: "Where is the collateral located?", placeholder: "Example: Ulaanbaatar, Bayangol district", collateralOnly: true },
  { key: "document_response", group: "Documents", label: "Document readiness", prompt: "Which supporting documents do you already have ready? Examples: national ID, income proof, bank statement, credit bureau report, collateral document, loan agreement. Type skip if none are ready yet.", placeholder: "Example: bank statement, national ID" },
  { key: "consent_granted", group: "Review", label: "Consent", prompt: "Do you consent to Obraims storing and processing this application information for MVP loan review purposes?" }
];
const initialAnswers: Answers = {
  full_name: "",
  phone: "",
  email: "",
  requested_amount: "",
  requested_term_months: "",
  loan_purpose: "",
  monthly_income: "",
  employment_status: "",
  address_line1: "",
  address_line2: "",
  district_city: "",
  province_state: "",
  postal_code: "",
  country: "Mongolia",
  has_collateral: null,
  collateral_type: "",
  collateral_description: "",
  collateral_estimated_value: "",
  collateral_ownership_status: "",
  collateral_location: "",
  document_response: "",
  consent_granted: null
};

const documentLabels: Partial<Record<IntakeDocumentType, string>> = {
  national_id: "National ID",
  income_proof: "Income or salary/business revenue proof",
  bank_statement: "Bank statement",
  credit_bureau: "Credit bureau report",
  business_registration: "Business registration",
  collateral_document: "Collateral ownership or valuation document",
  loan_agreement: "Other loan agreement",
  other_statement: "Other loan or account statement",
  other: "Other document"
};

function now() {
  return new Date().toISOString();
}

function assistant(content: string): ChatMessage {
  return { role: "assistant", content, created_at: now() };
}

function user(content: string): ChatMessage {
  return { role: "user", content, created_at: now() };
}

function normalizeOptional(value: string) {
  const cleaned = value.trim();
  return /^(skip|none|n\/a|no)$/i.test(cleaned) ? "" : cleaned;
}

function money(value: string | number | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "Not provided";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "MNT",
    maximumFractionDigits: 0
  }).format(parsed);
}

function requiredDocuments(answers: Answers): IntakeDocumentType[] {
  const purpose = answers.loan_purpose.toLowerCase();
  const status = answers.employment_status.toLowerCase();
  const docs: IntakeDocumentType[] = ["national_id", "income_proof", "bank_statement", "credit_bureau", "loan_agreement", "other_statement"];

  if (answers.has_collateral) {
    docs.push("collateral_document");
  }

  if (
    purpose.includes("business") ||
    purpose.includes("sme") ||
    purpose.includes("inventory") ||
    status.includes("business") ||
    status.includes("self-employed")
  ) {
    docs.push("business_registration");
  }

  return docs;
}

function buildDocuments(answers: Answers): IntakeDocument[] {
  const response = answers.document_response.toLowerCase();
  const readyMatchers: Partial<Record<IntakeDocumentType, string[]>> = {
    national_id: ["national", "id", "passport"],
    income_proof: ["income", "salary", "revenue", "payroll", "proof"],
    bank_statement: ["bank", "statement"],
    business_registration: ["business", "registration", "company"],
    collateral_document: ["collateral", "title", "valuation", "ownership"],
    loan_agreement: ["loan agreement", "agreement"],
    other_statement: ["other statement", "account statement"],
    other: ["other"]
  };

  return requiredDocuments(answers).map((type) => {
    const uploaded = (readyMatchers[type] ?? [type.replaceAll("_", " ")]).some((term) => response.includes(term));
    return {
      type,
      name: documentLabels[type] ?? type.replaceAll("_", " "),
      status: uploaded ? "uploaded" : "missing"
    };
  });
}

function nextStepIndex(fromIndex: number, nextAnswers: Answers) {
  for (let index = fromIndex + 1; index < answerSteps.length; index += 1) {
    const step = answerSteps[index];

    if (step.collateralOnly && nextAnswers.has_collateral !== true) {
      continue;
    }

    return index;
  }

  return -1;
}

function validateStep(step: (typeof answerSteps)[number], rawValue: string | boolean | null) {
  const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

  if (step.optional && typeof value === "string" && normalizeOptional(value) === "") {
    return null;
  }

  if (["full_name", "phone", "loan_purpose", "employment_status", "address_line1", "district_city"].includes(step.key) && !value) {
    return `${step.label} is required.`;
  }

  if (step.key === "email" && (typeof value !== "string" || !/^\S+@\S+\.\S+$/.test(value))) {
    return "Please enter a valid email address.";
  }

  if (step.key === "requested_amount" || step.key === "monthly_income") {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return `${step.label} must be greater than 0.`;
    }
  }

  if (step.key === "requested_term_months") {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return "Term must be a positive whole number.";
    }
  }

  if (step.key === "has_collateral" && typeof value !== "boolean") {
    return "Please choose yes or no.";
  }

  if (step.key === "collateral_type" && !value) {
    return "Please choose a collateral type.";
  }

  if (step.key === "collateral_description" && !value) {
    return "Please describe the collateral.";
  }

  if (step.key === "collateral_estimated_value" && value) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return "Collateral value must be greater than 0, or type skip if unknown.";
    }
  }

  if (step.key === "consent_granted" && value !== true) {
    return "Consent is required before submitting the application.";
  }

  return null;
}

function reviewLines(answers: Answers) {
  return [
    ["Full name", answers.full_name],
    ["Phone", answers.phone],
    ["Email", answers.email],
    ["Requested amount", money(answers.requested_amount)],
    ["Term", `${answers.requested_term_months} months`],
    ["Purpose", answers.loan_purpose],
    ["Monthly income", money(answers.monthly_income)],
    ["Employment/business status", answers.employment_status],
    ["Address", [answers.address_line1, answers.address_line2, answers.district_city, answers.province_state, answers.postal_code, answers.country].filter(Boolean).join(", ")],
    ["Collateral", answers.has_collateral ? "Yes" : "No"],
    ["Collateral type", answers.has_collateral ? answers.collateral_type : "Not offered"],
    ["Collateral value", answers.has_collateral ? money(answers.collateral_estimated_value) : "Not offered"]
  ];
}

export function ChatFlow() {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [messages, setMessages] = useState<ChatMessage[]>([
    assistant("Hi, I am the Obraims assistant. I will collect your loan application step by step."),
    assistant(answerSteps[0].prompt)
  ]);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"questions" | "summary" | "submitted">("questions");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const currentStep = answerSteps[stepIndex];
  const currentGroup = phase === "summary" ? "Review" : phase === "submitted" ? "Submitted" : currentStep.group;
  const canType = phase === "questions" && currentStep.key !== "employment_status" && currentStep.key !== "has_collateral" && currentStep.key !== "consent_granted" && currentStep.key !== "collateral_type";
  const documents = buildDocuments(answers);

  const transcript = useMemo<AIConversationMessage[]>(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
        created_at: message.created_at
      })),
    [messages]
  );

  function advanceWithAnswer(rawValue: string | boolean) {
    if (phase !== "questions") {
      return;
    }

    const validation = validateStep(currentStep, rawValue);

    if (validation) {
      setError(validation);
      setMessages((existing) => [...existing, assistant(validation)]);
      return;
    }

    const normalized =
      typeof rawValue === "string" && currentStep.optional
        ? normalizeOptional(rawValue)
        : typeof rawValue === "string" && currentStep.key === "country" && !rawValue.trim()
          ? "Mongolia"
          : rawValue;
    const displayValue =
      typeof normalized === "boolean" ? (normalized ? "Yes" : "No") : normalized || "Skipped";
    const nextAnswers = {
      ...answers,
      [currentStep.key]: normalized
    } as Answers;
    const nextMessages = [...messages, user(String(displayValue))];
    const nextIndex = nextStepIndex(stepIndex, nextAnswers);

    setAnswers(nextAnswers);
    setDraft("");
    setError(null);

    if (nextIndex >= 0) {
      setMessages([...nextMessages, assistant(answerSteps[nextIndex].prompt)]);
      setStepIndex(nextIndex);
      return;
    }

    setMessages([...nextMessages, assistant("Please review your application. Submit when everything looks correct.")]);
    setPhase("summary");
  }

  function submitDraft() {
    if (!canType) {
      return;
    }

    advanceWithAnswer(draft);
  }

  function submitApplication() {
    const payload: ChatApplicationPayload = {
      full_name: answers.full_name.trim(),
      phone: answers.phone.trim(),
      email: answers.email.trim(),
      requested_amount: Number(answers.requested_amount),
      requested_term_months: Number(answers.requested_term_months),
      loan_purpose: answers.loan_purpose.trim(),
      monthly_income: Number(answers.monthly_income),
      employment_status: answers.employment_status.trim(),
      address_line1: answers.address_line1.trim(),
      address_line2: answers.address_line2.trim() || null,
      district_city: answers.district_city.trim(),
      province_state: answers.province_state.trim() || null,
      postal_code: answers.postal_code.trim() || null,
      country: answers.country.trim() || "Mongolia",
      has_collateral: answers.has_collateral === true,
      collateral_type: answers.collateral_type.trim() || null,
      collateral_description: answers.collateral_description.trim() || null,
      collateral_estimated_value: answers.collateral_estimated_value ? Number(answers.collateral_estimated_value) : null,
      collateral_ownership_status: answers.collateral_ownership_status.trim() || null,
      collateral_location: answers.collateral_location.trim() || null,
      documents,
      consent_granted: answers.consent_granted === true,
      transcript: [...transcript, user("Submit application")]
    };

    startTransition(async () => {
      setError(null);
      const result = await submitChatApplication(payload);

      if (!result.ok) {
        setError(result.error);
        setMessages((existing) => [...existing, assistant(result.error)]);
        return;
      }

      setSubmittedId(result.applicationId);
      setPhase("submitted");
      setMessages((existing) => [...existing, assistant(`Submitted. Your application ID is ${result.applicationId}.`)]);
    });
  }

  function editAnswers() {
    setPhase("questions");
    setStepIndex(0);
    setDraft(answers.full_name);
    setError(null);
    setMessages((existing) => [...existing, user("Edit answers"), assistant("Of course. Let us review from the beginning."), assistant(answerSteps[0].prompt)]);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-panel">
      <div className="border-b border-line bg-surface px-5 py-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="caption uppercase tracking-wide text-primary">Chat application</p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal text-ink">Obraims assistant</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <span
                key={group}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  group === currentGroup ? "border-ink bg-ink text-white" : "border-line bg-white text-slate-600"
                }`}
              >
                {groupLabels[group]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-h-[520px] space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((message, index) => (
          <div key={`${message.created_at}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[82%] whitespace-pre-line rounded-xl border px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-slate-700"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-line p-5">
        {error ? (
          <div className="mb-4 rounded-xl border border-danger/20 bg-red-50 p-3 text-sm font-medium text-red-900">
            {error}
          </div>
        ) : null}

        {phase === "questions" ? (
          <QuestionControls
            stepKey={currentStep.key}
            placeholder={currentStep.placeholder}
            draft={draft}
            disabled={isPending}
            onDraftChange={setDraft}
            onSubmit={submitDraft}
            onQuickAnswer={advanceWithAnswer}
          />
        ) : null}

        {phase === "summary" ? (
          <div className="space-y-4">
            <ReviewCard answers={answers} documents={documents} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                disabled={isPending}
                onClick={submitApplication}
                className="btn-primary"
              >
                {isPending ? "Submitting..." : "Submit application"}
              </button>
              <button disabled={isPending} onClick={editAnswers} className="btn-secondary">Edit answers</button>
            </div>
          </div>
        ) : null}

        {phase === "submitted" && submittedId ? (
          <div className="rounded-xl border border-success/20 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-green-800">Application submitted</p>
            <p className="mt-1 text-sm text-slate-700">Application ID: {submittedId}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a className="btn-primary" href={`/app/application/${submittedId}`}>View application</a>
              <a className="btn-secondary" href="/app/admin/applications">Admin queue</a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function QuestionControls({
  stepKey,
  placeholder,
  draft,
  disabled,
  onDraftChange,
  onSubmit,
  onQuickAnswer
}: {
  stepKey: StepKey;
  placeholder?: string;
  draft: string;
  disabled: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  onQuickAnswer: (value: string | boolean) => void;
}) {
  if (stepKey === "employment_status") {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {["employed", "self-employed", "business owner", "unemployed", "other"].map((status) => (
            <button
              key={status}
              disabled={disabled}
              onClick={() => onQuickAnswer(status)}
              className="btn-secondary px-3 py-2 capitalize"
            >
              {status}
            </button>
          ))}
        </div>
        <TextInput value={draft} placeholder="Or type another status" disabled={disabled} onChange={onDraftChange} onSubmit={onSubmit} />
      </div>
    );
  }

  if (stepKey === "has_collateral" || stepKey === "consent_granted") {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          disabled={disabled}
          onClick={() => onQuickAnswer(true)}
          className="btn-accent"
        >Yes</button>
        <button
          disabled={disabled}
          onClick={() => onQuickAnswer(false)}
          className="btn-secondary"
        >No</button>
      </div>
    );
  }

  if (stepKey === "collateral_type") {
    return (
      <div className="flex flex-wrap gap-2">
        {["vehicle", "apartment", "land", "equipment", "inventory", "receivables", "other"].map((type) => (
          <button
            key={type}
            disabled={disabled}
            onClick={() => onQuickAnswer(type)}
            className="btn-secondary px-3 py-2 capitalize"
          >
            {type}
          </button>
        ))}
      </div>
    );
  }

  return <TextInput value={draft} placeholder={placeholder} disabled={disabled} onChange={onDraftChange} onSubmit={onSubmit} />;
}

function TextInput({
  value,
  placeholder,
  disabled,
  onChange,
  onSubmit
}: {
  value: string;
  placeholder?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        className="field"
      />
      <button disabled={disabled} onClick={onSubmit} className="btn-primary">Send</button>
    </div>
  );
}

function ReviewCard({ answers, documents }: { answers: Answers; documents: IntakeDocument[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h3 className="text-base font-semibold text-ink">Review application</h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {reviewLines(answers).map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-ink">{value || "Not provided"}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-xl border border-line bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document checklist</p>
        <ul className="mt-3 space-y-2">
          {documents.map((document) => (
            <li key={document.type} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-700">{document.name}</span>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${document.status === "uploaded" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                {document.status === "uploaded" ? "Ready" : "Missing"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}





