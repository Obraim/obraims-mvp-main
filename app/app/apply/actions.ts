"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/obraims/access-control";
import { createApplication, uploadApplicationDocument, type IntakeDocumentType } from "@/src/lib/obraims/simple-core";

export type ApplyFormValues = {
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
  has_collateral: boolean;
  collateral_type: string;
  collateral_description: string;
  collateral_estimated_value: string;
  collateral_ownership_status: string;
  collateral_location: string;
  consent: boolean;
};

export type ApplyFormState = {
  errors: Partial<Record<keyof ApplyFormValues | "form", string>>;
  values: ApplyFormValues;
  submittedAt: number;
};

const applyDocumentUploads: Array<{ key: string; documentType: IntakeDocumentType }> = [
  { key: "bank_statement_file", documentType: "bank_statement" },
  { key: "credit_bureau_file", documentType: "credit_bureau" },
  { key: "collateral_document_file", documentType: "collateral_document" },
  { key: "loan_agreement_file", documentType: "loan_agreement" },
  { key: "other_statement_file", documentType: "other_statement" }
];

function value(formData: FormData, key: keyof ApplyFormValues) {
  return String(formData.get(key) ?? "").trim();
}

function optionalFile(formData: FormData, key: string) {
  const file = formData.get(key);
  return file instanceof File && file.size > 0 ? file : null;
}

function parsePositiveNumber(raw: string, label: string) {
  const parsed = Number(raw);

  if (!raw || !Number.isFinite(parsed) || parsed <= 0) {
    return { value: null, error: `${label} must be greater than 0.` };
  }

  return { value: parsed, error: null };
}

function parsePositiveInteger(raw: string, label: string) {
  const parsed = Number(raw);

  if (!raw || !Number.isInteger(parsed) || parsed <= 0) {
    return { value: null, error: `${label} must be a positive whole number.` };
  }

  return { value: parsed, error: null };
}

export async function submitApplyForm(_previousState: ApplyFormState, formData: FormData): Promise<ApplyFormState> {
  const values: ApplyFormValues = {
    full_name: value(formData, "full_name"),
    phone: value(formData, "phone"),
    email: value(formData, "email"),
    requested_amount: value(formData, "requested_amount"),
    requested_term_months: value(formData, "requested_term_months"),
    loan_purpose: value(formData, "loan_purpose"),
    monthly_income: value(formData, "monthly_income"),
    employment_status: value(formData, "employment_status"),
    address_line1: value(formData, "address_line1"),
    address_line2: value(formData, "address_line2"),
    district_city: value(formData, "district_city"),
    province_state: value(formData, "province_state"),
    postal_code: value(formData, "postal_code"),
    country: value(formData, "country") || "Mongolia",
    has_collateral: formData.get("has_collateral") === "on",
    collateral_type: value(formData, "collateral_type"),
    collateral_description: value(formData, "collateral_description"),
    collateral_estimated_value: value(formData, "collateral_estimated_value"),
    collateral_ownership_status: value(formData, "collateral_ownership_status"),
    collateral_location: value(formData, "collateral_location"),
    consent: formData.get("consent") === "on"
  };
  const errors: ApplyFormState["errors"] = {};
  const currentUser = await getCurrentUser();
  const authenticatedEmail = currentUser?.email?.trim().toLowerCase() ?? null;

  if (authenticatedEmail) {
    const submittedEmail = values.email.trim().toLowerCase();

    if (submittedEmail && submittedEmail !== authenticatedEmail) {
      errors.email = "Use the same email as your signed-in Obraims account.";
    } else {
      values.email = authenticatedEmail;
    }
  }

  if (!values.full_name) {
    errors.full_name = "Full name is required.";
  }

  if (!values.phone) {
    errors.phone = "Phone number is required.";
  }

  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = "Enter a valid email or leave blank.";
  }

  const requestedAmount = parsePositiveNumber(values.requested_amount, "Requested amount");
  if (requestedAmount.error) {
    errors.requested_amount = requestedAmount.error;
  }

  const requestedTermMonths = parsePositiveInteger(values.requested_term_months, "Term");
  if (requestedTermMonths.error) {
    errors.requested_term_months = requestedTermMonths.error;
  }

  const monthlyIncome = values.monthly_income ? parsePositiveNumber(values.monthly_income, "Monthly income") : { value: null, error: null };
  if (monthlyIncome.error) {
    errors.monthly_income = monthlyIncome.error;
  }

  if (!values.loan_purpose) {
    errors.loan_purpose = "Loan purpose is required.";
  }

  if (!values.employment_status) {
    errors.employment_status = "Employment or business status is required.";
  }

  if (!values.address_line1) {
    errors.address_line1 = "Address is required.";
  }

  if (!values.district_city) {
    errors.district_city = "District or city is required.";
  }

  const collateralValue = values.collateral_estimated_value
    ? parsePositiveNumber(values.collateral_estimated_value, "Collateral estimated value")
    : { value: null, error: null };
  if (collateralValue.error) {
    errors.collateral_estimated_value = collateralValue.error;
  }

  if (values.has_collateral && !values.collateral_type) {
    errors.collateral_type = "Collateral type is required.";
  }

  if (values.has_collateral && !values.collateral_description) {
    errors.collateral_description = "Collateral description is required.";
  }

  if (!values.consent) {
    errors.consent = "Consent is required before submitting.";
  }

  if (Object.keys(errors).length > 0 || requestedAmount.value === null || requestedTermMonths.value === null) {
    return {
      errors,
      values,
      submittedAt: Date.now()
    };
  }

  try {
    const headerStore = headers();
    const userAgent = headerStore.get("user-agent");
    const ipAddress = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const audit = {
      actorType: "customer",
      ipAddress,
      userAgent
    };

    const application = await createApplication({
      authUserId: currentUser?.id ?? null,
      fullName: values.full_name,
      phone: values.phone,
      email: values.email || null,
      requestedAmount: requestedAmount.value,
      requestedTermMonths: requestedTermMonths.value,
      loanPurpose: values.loan_purpose,
      monthlyIncome: monthlyIncome.value,
      employmentStatus: values.employment_status,
      addressLine1: values.address_line1,
      addressLine2: values.address_line2 || null,
      districtCity: values.district_city,
      provinceState: values.province_state || null,
      postalCode: values.postal_code || null,
      country: values.country || "Mongolia",
      hasCollateral: values.has_collateral,
      collateralType: values.collateral_type || null,
      collateralDescription: values.collateral_description || null,
      collateralEstimatedValue: collateralValue.value,
      collateralOwnershipStatus: values.collateral_ownership_status || null,
      collateralLocation: values.collateral_location || null,
      documents: [],
      consentGranted: values.consent,
      channel: "web",
      source: "traditional_form",
      audit
    });

    for (const upload of applyDocumentUploads) {
      const file = optionalFile(formData, upload.key);

      if (!file) {
        continue;
      }

      await uploadApplicationDocument({
        loanApplicationId: application.id,
        documentType: upload.documentType,
        file,
        audit: {
          ...audit,
          metadata: {
            action_source: "apply_form_attachment",
            document_type: upload.documentType
          }
        }
      });
    }

    redirect(`/app/application/${application.id}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    return {
      errors: {
        form: error instanceof Error ? error.message : "Unable to submit loan application."
      },
      values,
      submittedAt: Date.now()
    };
  }
}
