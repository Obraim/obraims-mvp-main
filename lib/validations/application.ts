import { z } from "zod";

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}, z.coerce.number().nonnegative().optional());

export const applicationSchema = z.object({
  borrowerType: z.enum(["INDIVIDUAL", "BUSINESS"]),
  loanType: z.enum(["BUSINESS_LOAN", "PERSONAL_LOAN", "MORTGAGE", "WORKING_CAPITAL", "EQUIPMENT_FINANCE"]),
  requestedAmount: z.coerce.number().min(1000, "Enter at least 1,000."),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("USD"),
  requestedTermMonths: z.coerce.number().int().min(1).max(360),
  loanPurpose: z.string().min(10, "Describe the purpose in at least 10 characters."),
  legalName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6),
  address: z.string().trim().min(5),
  registrationNumber: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  annualRevenue: optionalNumber
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
