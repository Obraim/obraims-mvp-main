import { z } from "zod";

export const documentTypeSchema = z.enum([
  "ID",
  "BANK_STATEMENT",
  "CREDIT_BUREAU",
  "FINANCIAL_STATEMENT",
  "TAX_RETURN",
  "BUSINESS_REGISTRATION",
  "COLLATERAL_DOCUMENT",
  "LOAN_AGREEMENT",
  "OTHER_STATEMENT",
  "CONTRACT",
  "OTHER"
]);

const defaultAllowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

export function getAllowedUploadMimeTypes() {
  return (process.env.ALLOWED_UPLOAD_MIME_TYPES ?? defaultAllowedMimeTypes.join(","))
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getMaxUploadBytes() {
  const megabytes = Number(process.env.MAX_UPLOAD_MB ?? "10");
  return Math.max(1, megabytes) * 1024 * 1024;
}

export function validateUploadedFile(file: File) {
  const allowedMimeTypes = getAllowedUploadMimeTypes();
  const maxUploadBytes = getMaxUploadBytes();

  const schema = z
    .instanceof(File)
    .refine((value) => value.size > 0, "The uploaded file is empty.")
    .refine((value) => value.size <= maxUploadBytes, `File must not exceed ${Math.round(maxUploadBytes / 1024 / 1024)} MB.`)
    .refine((value) => allowedMimeTypes.includes(value.type), "Unsupported file type.");

  return schema.safeParse(file);
}
