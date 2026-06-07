import "server-only";
import type { Customer, DocumentRecord, LoanApplication } from "./simple-core";

export type CreditMemo = {
  generated_at: string;
  model: string;
  borrower_summary: string;
  request_summary: string;
  document_summary: string;
  strengths: string[];
  risks: string[];
  missing_items: string[];
  recommended_next_steps: string[];
  lending_requirements: string[];
  disclaimer: string;
};

type CreditMemoApplication = LoanApplication & {
  customer: Customer;
};

const creditMemoSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    borrower_summary: { type: "string" },
    request_summary: { type: "string" },
    document_summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    missing_items: { type: "array", items: { type: "string" } },
    recommended_next_steps: { type: "array", items: { type: "string" } },
    lending_requirements: { type: "array", items: { type: "string" } },
    disclaimer: { type: "string" }
  },
  required: [
    "borrower_summary",
    "request_summary",
    "document_summary",
    "strengths",
    "risks",
    "missing_items",
    "recommended_next_steps",
    "lending_requirements",
    "disclaimer"
  ]
};

function outputText(response: unknown) {
  const typed = response as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (typeof typed.output_text === "string") {
    return typed.output_text;
  }

  return (
    typed.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter((text): text is string => Boolean(text))
      .join("\n") ?? ""
  );
}

function documentSnapshot(application: CreditMemoApplication, records: DocumentRecord[]) {
  const checklist = application.documents.map((document) => ({
    type: document.type,
    name: document.name,
    status: document.status
  }));

  return {
    checklist,
    uploaded_records: records.map((document) => ({
      type: document.document_type,
      file_name: document.file_name,
      status: document.status,
      created_at: document.created_at
    }))
  };
}

export async function generateCreditMemo(input: {
  application: CreditMemoApplication;
  documentRecords: DocumentRecord[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Add it in Vercel/server env before generating credit memos.");
  }

  const model = process.env.OPENAI_CREDIT_MEMO_MODEL ?? "gpt-5.2";
  const payload = {
    application: {
      id: input.application.id,
      customer_name: input.application.customer.full_name,
      phone: input.application.customer.phone,
      email: input.application.customer.email,
      requested_amount: input.application.requested_amount,
      requested_term_months: input.application.requested_term_months,
      loan_purpose: input.application.loan_purpose,
      monthly_income: input.application.monthly_income,
      employment_status: input.application.employment_status,
      address: {
        address_line1: input.application.address_line1,
        district_city: input.application.district_city,
        province_state: input.application.province_state,
        country: input.application.country
      },
      collateral: {
        has_collateral: input.application.has_collateral,
        type: input.application.collateral_type,
        description: input.application.collateral_description,
        estimated_value: input.application.collateral_estimated_value,
        ownership_status: input.application.collateral_ownership_status,
        location: input.application.collateral_location
      },
      status: input.application.status,
      channel: input.application.channel,
      source: input.application.source
    },
    documents: documentSnapshot(input.application, input.documentRecords)
  };
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You are a lending analyst drafting an internal MVP credit memo. Do not approve or reject the loan. Never promise loan approval. Explain lending requirements clearly. Use concise professional English."
        },
        {
          role: "user",
          content: `Draft a preliminary credit memo from this application data. Use only the supplied data and document filenames/statuses; do not infer verified facts from filenames. JSON data:\n${JSON.stringify(payload)}`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "obraims_credit_memo",
          schema: creditMemoSchema,
          strict: true
        }
      }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI credit memo generation failed: ${message}`);
  }

  const json = await response.json();
  const text = outputText(json);

  if (!text) {
    throw new Error("OpenAI credit memo generation returned no text.");
  }

  const memo = JSON.parse(text) as Omit<CreditMemo, "generated_at" | "model">;
  return {
    ...memo,
    generated_at: new Date().toISOString(),
    model
  };
}
