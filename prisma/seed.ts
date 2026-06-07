import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("obraims-demo", 10);

  const borrower = await prisma.user.upsert({
    where: { email: "amina@example.com" },
    update: { preferredLanguage: "en" },
    create: {
      email: "amina@example.com",
      name: "Amina Rahman",
      passwordHash,
      role: "BORROWER",
      preferredLanguage: "en"
    }
  });

  const officer = await prisma.user.upsert({
    where: { email: "daniel@obraims.local" },
    update: { preferredLanguage: "en" },
    create: {
      email: "daniel@obraims.local",
      name: "Daniel Kim",
      passwordHash,
      role: "LOAN_OFFICER",
      preferredLanguage: "en"
    }
  });

  await prisma.user.upsert({
    where: { email: "priya@obraims.local" },
    update: { preferredLanguage: "en" },
    create: {
      email: "priya@obraims.local",
      name: "Priya Shah",
      passwordHash,
      role: "CREDIT_ANALYST",
      preferredLanguage: "en"
    }
  });

  await prisma.user.upsert({
    where: { email: "admin@obraims.local" },
    update: { preferredLanguage: "en" },
    create: {
      email: "admin@obraims.local",
      name: "Morgan Lee",
      passwordHash,
      role: "ADMIN",
      preferredLanguage: "en"
    }
  });

  const borrowerProfile = await prisma.borrowerProfile.upsert({
    where: { userId: borrower.id },
    update: {
      borrowerType: "BUSINESS",
      legalName: "Rahman Specialty Foods LLC",
      registrationNumber: "RSF-44291",
      phone: "+1 555 0171",
      address: "88 Market Street, Denver, CO",
      industry: "Food distribution",
      annualRevenue: 920000
    },
    create: {
      userId: borrower.id,
      borrowerType: "BUSINESS",
      legalName: "Rahman Specialty Foods LLC",
      registrationNumber: "RSF-44291",
      phone: "+1 555 0171",
      address: "88 Market Street, Denver, CO",
      industry: "Food distribution",
      annualRevenue: 920000
    }
  });

  const application = await prisma.loanApplication.upsert({
    where: { applicationNumber: "LNX-2026-001" },
    update: {
      borrowerProfileId: borrowerProfile.id,
      assignedOfficerId: officer.id,
      loanType: "WORKING_CAPITAL",
      requestedAmount: 185000,
      currency: "USD",
      requestedTermMonths: 36,
      loanPurpose: "Working capital facility to expand inventory and bridge seasonal receivables.",
      status: "IN_REVIEW",
      aiSummary: "Business working capital request with moderate exposure and incomplete tax documentation pending.",
      aiRiskScore: 52,
      aiRiskFlags: ["Tax returns missing", "Verify bank statement cash flow"],
      aiMissingDocuments: ["TAX_RETURN"]
    },
    create: {
      borrowerProfileId: borrowerProfile.id,
      assignedOfficerId: officer.id,
      applicationNumber: "LNX-2026-001",
      loanType: "WORKING_CAPITAL",
      requestedAmount: 185000,
      currency: "USD",
      requestedTermMonths: 36,
      loanPurpose: "Working capital facility to expand inventory and bridge seasonal receivables.",
      status: "IN_REVIEW",
      aiSummary: "Business working capital request with moderate exposure and incomplete tax documentation pending.",
      aiRiskScore: 52,
      aiRiskFlags: ["Tax returns missing", "Verify bank statement cash flow"],
      aiMissingDocuments: ["TAX_RETURN"]
    }
  });

  await prisma.document.deleteMany({
    where: { loanApplicationId: application.id }
  });

  await prisma.document.createMany({
    data: [
      {
        loanApplicationId: application.id,
        uploadedById: borrower.id,
        documentType: "ID",
        fileName: "director-passport.pdf",
        filePath: "uploads/app-001/director-passport.pdf",
        mimeType: "application/pdf",
        fileSize: 328000,
        extractedText: "Passport identity document metadata extracted.",
        status: "PROCESSED"
      },
      {
        loanApplicationId: application.id,
        uploadedById: borrower.id,
        documentType: "BANK_STATEMENT",
        fileName: "business-bank-statements-q1.pdf",
        filePath: "uploads/app-001/business-bank-statements-q1.pdf",
        mimeType: "application/pdf",
        fileSize: 1452000,
        extractedText: "Three months of bank statement text extracted for cash flow review.",
        status: "PROCESSED"
      }
    ]
  });

  await prisma.applicationNote.deleteMany({
    where: { loanApplicationId: application.id }
  });

  await prisma.applicationNote.create({
    data: {
      loanApplicationId: application.id,
      authorId: officer.id,
      content: "Seeded review note: request latest tax return before credit committee review."
    }
  });

  await prisma.statusHistory.deleteMany({
    where: { loanApplicationId: application.id }
  });

  await prisma.statusHistory.create({
    data: {
      loanApplicationId: application.id,
      changedById: officer.id,
      oldStatus: "SUBMITTED",
      newStatus: "IN_REVIEW",
      comment: "Seeded application moved into officer review."
    }
  });

  await prisma.aiAnalysis.deleteMany({
    where: { loanApplicationId: application.id }
  });

  await prisma.aiAnalysis.createMany({
    data: [
      {
        loanApplicationId: application.id,
        provider: "mock",
        model: "mock-credit-analyst-v1",
        analysisType: "SUMMARY",
        inputSnapshot: {
          applicationNumber: "LNX-2026-001",
          documentCount: 2
        },
        output: {
          summary: "Business working capital request with moderate exposure and incomplete tax documentation pending."
        }
      },
      {
        loanApplicationId: application.id,
        provider: "mock",
        model: "mock-credit-analyst-v1",
        analysisType: "RISK_FLAGS",
        inputSnapshot: {
          requestedAmount: 185000,
          requestedTermMonths: 36
        },
        output: {
          riskScore: 52,
          riskFlags: ["Tax returns missing", "Verify bank statement cash flow"]
        }
      },
      {
        loanApplicationId: application.id,
        provider: "mock",
        model: "mock-credit-analyst-v1",
        analysisType: "MISSING_DOCS",
        inputSnapshot: {
          uploadedDocumentTypes: ["ID", "BANK_STATEMENT"]
        },
        output: {
          missingDocuments: ["TAX_RETURN"]
        }
      },
      {
        loanApplicationId: application.id,
        provider: "mock",
        model: "mock-credit-analyst-v1",
        analysisType: "CREDIT_MEMO",
        inputSnapshot: {
          applicationNumber: "LNX-2026-001",
          borrowerLegalName: "Rahman Specialty Foods LLC"
        },
        output: {
          memo:
            "Borrower requests a working capital facility to expand inventory and bridge seasonal receivables. Automated review indicates moderate risk pending tax return verification and cash flow review."
        }
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
