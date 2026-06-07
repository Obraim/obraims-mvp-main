"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { DocumentType } from "@/lib/types";

const documentTypes: DocumentType[] = [
  "ID",
  "BANK_STATEMENT",
  "FINANCIAL_STATEMENT",
  "TAX_RETURN",
  "BUSINESS_REGISTRATION",
  "COLLATERAL_DOCUMENT",
  "CONTRACT",
  "OTHER"
];

export function DocumentUploadForm({ applicationId }: { applicationId: string }) {
  const [message, setMessage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const t = useTranslations("Documents");
  const documentType = useTranslations("DocumentType");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsUploading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/applications/${applicationId}/documents`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      await response.json().catch(() => undefined);
      setMessage(t("uploadFailed"));
      setIsUploading(false);
      return;
    }

    const payload = (await response.json()) as { fileName: string };
    event.currentTarget.reset();
    setMessage(t("uploadedAndExtracted", { fileName: payload.fileName }));
    setIsUploading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded border border-line bg-white p-6 shadow-soft">
      <div>
        <label htmlFor="documentType" className="text-sm font-medium text-slate-700">
          {t("documentType")}
        </label>
        <select
          id="documentType"
          name="documentType"
          className="focus-ring mt-2 w-full rounded border border-line bg-white px-3 py-2"
        >
          {documentTypes.map((type) => (
            <option key={type} value={type}>
              {documentType(type)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="file" className="text-sm font-medium text-slate-700">
          {t("file")}
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          className="focus-ring mt-2 w-full rounded border border-dashed border-line bg-surface px-3 py-6 text-sm"
        />
      </div>
      <button
        disabled={isUploading}
        className="btn-accent"
      >
        {isUploading ? t("uploading") : t("uploadDocument")}
      </button>
      {message ? <p className="text-sm font-medium text-teal">{message}</p> : null}
    </form>
  );
}
