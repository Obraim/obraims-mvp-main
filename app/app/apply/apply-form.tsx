"use client";

import { useEffect, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitApplyForm, type ApplyFormState } from "./actions";

const initialApplyFormState: ApplyFormState = {
  errors: {},
  values: {
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
    has_collateral: false,
    collateral_type: "",
    collateral_description: "",
    collateral_estimated_value: "",
    collateral_ownership_status: "",
    collateral_location: "",
    consent: false
  },
  submittedAt: 0
};

export function ApplyForm() {
  const [state, formAction] = useFormState(submitApplyForm, initialApplyFormState);
  const [hideErrors, setHideErrors] = useState(false);
  const visibleErrors = hideErrors ? {} : state.errors;

  useEffect(() => {
    setHideErrors(false);
  }, [state.submittedAt]);

  return (
    <form
      key={state.submittedAt}
      action={formAction}
      encType="multipart/form-data"
      onChange={() => setHideErrors(true)}
      noValidate
      className="panel overflow-hidden"
    >
      {visibleErrors.form ? (
        <div className="m-5 rounded-xl border border-danger/20 bg-red-50 p-4 text-sm font-medium text-red-900">
          {visibleErrors.form}
        </div>
      ) : null}

      <FormSection
        title="Applicant"
        description="Use the same email address later when signing in to track application status."
      >
        <TextField label="Full name" name="full_name" error={visibleErrors.full_name} defaultValue={state.values.full_name} autoComplete="name" />
        <TextField label="Phone" name="phone" error={visibleErrors.phone} defaultValue={state.values.phone} autoComplete="tel" />
        <TextField label="Email (optional)" name="email" type="email" error={visibleErrors.email} defaultValue={state.values.email} autoComplete="email" />
      </FormSection>

      <FormSection title="Loan request" description="Tell us how much you need, for how long, and why.">
        <TextField label="Requested amount" name="requested_amount" type="number" min="1" error={visibleErrors.requested_amount} defaultValue={state.values.requested_amount} />
        <TextField label="Term in months" name="requested_term_months" type="number" min="1" step="1" error={visibleErrors.requested_term_months} defaultValue={state.values.requested_term_months} />
        <TextField label="Monthly income" name="monthly_income" type="number" min="1" error={visibleErrors.monthly_income} defaultValue={state.values.monthly_income} />
        <TextField label="Employment or business status" name="employment_status" error={visibleErrors.employment_status} defaultValue={state.values.employment_status} className="md:col-span-3" />
        <label className="label block md:col-span-3">
          Loan purpose
          <textarea
            name="loan_purpose"
            rows={4}
            defaultValue={state.values.loan_purpose}
            aria-invalid={Boolean(visibleErrors.loan_purpose)}
            className="field mt-2"
          />
          <FieldError error={visibleErrors.loan_purpose} />
        </label>
      </FormSection>

      <FormSection title="Address" description="Address details help reviewers validate the borrower profile.">
        <TextField label="Address line 1" name="address_line1" error={visibleErrors.address_line1} defaultValue={state.values.address_line1} autoComplete="address-line1" />
        <TextField label="Address line 2 (optional)" name="address_line2" error={visibleErrors.address_line2} defaultValue={state.values.address_line2} autoComplete="address-line2" />
        <TextField label="District / city" name="district_city" error={visibleErrors.district_city} defaultValue={state.values.district_city} autoComplete="address-level2" />
        <TextField label="Province / state (optional)" name="province_state" error={visibleErrors.province_state} defaultValue={state.values.province_state} autoComplete="address-level1" />
        <TextField label="Postal code (optional)" name="postal_code" error={visibleErrors.postal_code} defaultValue={state.values.postal_code} autoComplete="postal-code" />
        <TextField label="Country" name="country" error={visibleErrors.country} defaultValue={state.values.country} autoComplete="country-name" />
      </FormSection>

      <FormSection title="Collateral" description="Optional. Add collateral details if the request is secured or partially secured.">
        <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4 text-sm text-slate-700 md:col-span-3">
          <input
            name="has_collateral"
            type="checkbox"
            defaultChecked={state.values.has_collateral}
            className="mt-1 h-4 w-4 rounded border-line"
          />
          <span>I would like to offer collateral for this application.</span>
        </label>
        <TextField label="Collateral type" name="collateral_type" error={visibleErrors.collateral_type} defaultValue={state.values.collateral_type} placeholder="Vehicle, apartment, land, equipment, inventory, receivables, other" />
        <TextField label="Estimated value" name="collateral_estimated_value" type="number" min="1" error={visibleErrors.collateral_estimated_value} defaultValue={state.values.collateral_estimated_value} />
        <TextField label="Ownership status" name="collateral_ownership_status" error={visibleErrors.collateral_ownership_status} defaultValue={state.values.collateral_ownership_status} placeholder="Owned, jointly owned, financed" />
        <TextField label="Collateral location" name="collateral_location" error={visibleErrors.collateral_location} defaultValue={state.values.collateral_location} />
        <label className="label block md:col-span-3">
          Collateral description
          <textarea
            name="collateral_description"
            rows={3}
            defaultValue={state.values.collateral_description}
            aria-invalid={Boolean(visibleErrors.collateral_description)}
            className="field mt-2"
          />
          <FieldError error={visibleErrors.collateral_description} />
        </label>
      </FormSection>

      <FormSection
        title="Supporting documents"
        description="Optional for first submission. Files are stored privately and admins access them through signed links."
        tone="ai"
      >
        <FileField label="Bank statement" name="bank_statement_file" />
        <FileField label="Credit bureau report" name="credit_bureau_file" />
        <FileField label="Collateral document" name="collateral_document_file" />
        <FileField label="Other loan agreement" name="loan_agreement_file" />
        <FileField label="Other loan or account statement" name="other_statement_file" className="md:col-span-2" />
      </FormSection>

      <div className="border-t border-line bg-surface/70 p-5">
        <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 text-sm text-slate-700">
          <input
            name="consent"
            type="checkbox"
            defaultChecked={state.values.consent}
            className="mt-1 h-4 w-4 rounded border-line"
          />
          <span>
            I consent to Obraims storing and processing this application information for MVP loan review purposes.
            <FieldError error={visibleErrors.consent} />
          </span>
        </label>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">Submitting creates the customer, consent, application, document, and audit records.</p>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
  tone = "default"
}: {
  title: string;
  description: string;
  children: ReactNode;
  tone?: "default" | "ai";
}) {
  const toneClass = tone === "ai" ? "bg-aiSoft/50" : "bg-white";

  return (
    <section className={`border-b border-line p-5 ${toneClass}`}>
      <div className="mb-5">
        <h3 className="text-lg font-semibold tracking-normal text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">{children}</div>
    </section>
  );
}

function TextField({
  label,
  name,
  error,
  defaultValue,
  className = "",
  ...inputProps
}: {
  label: string;
  name: keyof ApplyFormState["values"];
  error?: string;
  defaultValue: string;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue" | "className">) {
  return (
    <label className={`label block ${className}`}>
      {label}
      <input
        {...inputProps}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        className="field mt-2"
      />
      <FieldError error={error} />
    </label>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? <p className="mt-2 text-sm font-medium text-red-700">{error}</p> : null;
}

function FileField({
  label,
  name,
  className = ""
}: {
  label: string;
  name: string;
  className?: string;
}) {
  return (
    <label className={`label block ${className}`}>
      {label}
      <input name={name} type="file" className="file-input mt-2" />
      <span className="caption mt-1 block">PDF, image, or statement export.</span>
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} className="btn-primary">
      {pending ? "Submitting..." : "Submit application"}
    </button>
  );
}
