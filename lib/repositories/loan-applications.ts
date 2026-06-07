import { getApplicationById, getApplicationMetrics, getApplications } from "@/lib/data";

// TODO: Replace these demo-data delegates with Prisma queries before production use.
export const loanApplicationRepository = {
  findMany: getApplications,
  findById: getApplicationById,
  getMetrics: getApplicationMetrics
};
