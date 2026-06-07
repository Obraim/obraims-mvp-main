import { getAiProvider } from "@/lib/ai";
import type {
  AgentActionLog,
  AgentTask,
  ApplicationStatus,
  BorrowerProfileSummary,
  Conversation,
  LoanApplication,
  MissingDocumentChecklistItem,
  RequiredDocumentRule,
  UserSummary
} from "@/lib/types";

export const users: UserSummary[] = [
  {
    id: "user-borrower-1",
    name: "Amina Rahman",
    email: "amina@example.com",
    role: "BORROWER",
    preferredLanguage: "en"
  },
  {
    id: "user-officer-1",
    name: "Daniel Kim",
    email: "daniel@obraims.local",
    role: "LOAN_OFFICER",
    preferredLanguage: "en"
  },
  {
    id: "user-analyst-1",
    name: "Priya Shah",
    email: "priya@obraims.local",
    role: "CREDIT_ANALYST",
    preferredLanguage: "en"
  },
  {
    id: "user-admin-1",
    name: "Morgan Lee",
    email: "admin@obraims.local",
    role: "ADMIN",
    preferredLanguage: "en"
  }
];

const officer = users.find((user) => user.role === "LOAN_OFFICER");
const borrower = users.find((user) => user.role === "BORROWER");

if (!officer || !borrower) {
  throw new Error("Demo users are not configured.");
}

const borrowerProfiles: BorrowerProfileSummary[] = [
  {
    id: "profile-001",
    user: borrower,
    borrowerType: "BUSINESS",
    legalName: "Rahman Specialty Foods LLC",
    registrationNumber: "RSF-44291",
    phone: "+1 555 0171",
    address: "88 Market Street, Denver, CO",
    industry: "Food distribution",
    annualRevenue: 920000
  },
  {
    id: "profile-002",
    user: {
      id: "user-borrower-2",
      name: "Elena Torres",
      email: "elena@example.com",
      role: "BORROWER",
      preferredLanguage: "en"
    },
    borrowerType: "INDIVIDUAL",
    legalName: "Elena Torres",
    phone: "+1 555 0182",
    address: "214 Cedar Street, Austin, TX",
    industry: "Healthcare",
    annualRevenue: 94000
  },
  {
    id: "profile-003",
    user: {
      id: "user-borrower-3",
      name: "Koji Nakamura",
      email: "koji@example.com",
      role: "BORROWER",
      preferredLanguage: "en"
    },
    borrowerType: "BUSINESS",
    legalName: "Nakamura Fabrication Co.",
    registrationNumber: "NFC-90177",
    phone: "+1 555 0199",
    address: "450 Industrial Way, Portland, OR",
    industry: "Manufacturing",
    annualRevenue: 1420000
  },
  {
    id: "profile-004",
    user: borrower,
    borrowerType: "BUSINESS",
    legalName: "New Demo Business",
    phone: "+1 555 0144",
    address: "101 Main Street, Boise, ID",
    industry: "Services",
    annualRevenue: 250000
  }
];

const baseApplications: LoanApplication[] = [
  {
    id: "app-004",
    applicationNumber: "LNX-2026-004",
    loanType: "WORKING_CAPITAL",
    status: "DRAFT",
    requestedAmount: 75000,
    currency: "USD",
    loanPurpose: "Working capital for inventory purchase and receivables bridge.",
    requestedTermMonths: 36,
    borrowerProfile: borrowerProfiles[3],
    assignedOfficer: officer,
    documents: [],
    notes: [],
    statusHistory: [
      {
        id: "history-004-001",
        changedBy: officer,
        oldStatus: "DRAFT",
        newStatus: "DRAFT",
        comment: "Draft started from borrower portal.",
        createdAt: "2026-05-01T08:00:00.000Z"
      }
    ],
    createdAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-01T08:00:00.000Z"
  },
  {
    id: "app-001",
    applicationNumber: "LNX-2026-001",
    loanType: "WORKING_CAPITAL",
    status: "IN_REVIEW",
    requestedAmount: 185000,
    currency: "USD",
    loanPurpose: "Working capital facility to expand inventory and bridge seasonal receivables.",
    requestedTermMonths: 36,
    borrowerProfile: borrowerProfiles[0],
    assignedOfficer: officer,
    documents: [
      {
        id: "doc-001",
        documentType: "ID",
        fileName: "director-passport.pdf",
        filePath: "uploads/app-001/director-passport.pdf",
        mimeType: "application/pdf",
        fileSize: 328000,
        extractedText: "Passport identity document metadata extracted.",
        status: "PROCESSED",
        createdAt: "2026-04-24T09:10:00.000Z",
        updatedAt: "2026-04-24T09:12:00.000Z"
      },
      {
        id: "doc-002",
        documentType: "BANK_STATEMENT",
        fileName: "business-bank-statements-q1.pdf",
        filePath: "uploads/app-001/business-bank-statements-q1.pdf",
        mimeType: "application/pdf",
        fileSize: 1452000,
        extractedText: "Three months of bank statement text extracted for cash flow review.",
        status: "PROCESSED",
        createdAt: "2026-04-24T09:20:00.000Z",
        updatedAt: "2026-04-24T09:23:00.000Z"
      }
    ],
    notes: [
      {
        id: "note-001",
        author: officer,
        content: "Request the latest tax return before credit committee review.",
        createdAt: "2026-04-25T14:10:00.000Z",
        updatedAt: "2026-04-25T14:10:00.000Z"
      }
    ],
    statusHistory: [
      {
        id: "history-001-001",
        changedBy: borrower,
        oldStatus: "DRAFT",
        newStatus: "SUBMITTED",
        comment: "Borrower submitted application with initial documents.",
        createdAt: "2026-04-24T09:25:00.000Z"
      },
      {
        id: "history-001-002",
        changedBy: officer,
        oldStatus: "SUBMITTED",
        newStatus: "IN_REVIEW",
        comment: "Assigned to loan officer review queue.",
        createdAt: "2026-04-25T15:30:00.000Z"
      }
    ],
    createdAt: "2026-04-22T11:15:00.000Z",
    updatedAt: "2026-04-25T15:30:00.000Z"
  },
  {
    id: "app-002",
    applicationNumber: "LNX-2026-002",
    loanType: "PERSONAL_LOAN",
    status: "MORE_INFO_NEEDED",
    requestedAmount: 42000,
    currency: "USD",
    loanPurpose: "Debt consolidation and home repair financing.",
    requestedTermMonths: 60,
    borrowerProfile: borrowerProfiles[1],
    assignedOfficer: officer,
    documents: [
      {
        id: "doc-003",
        documentType: "ID",
        fileName: "drivers-license.png",
        filePath: "uploads/app-002/drivers-license.png",
        mimeType: "image/png",
        fileSize: 220000,
        extractedText: "Driver license image processed for borrower identity metadata.",
        status: "PROCESSED",
        createdAt: "2026-04-26T13:12:00.000Z",
        updatedAt: "2026-04-26T13:13:00.000Z"
      }
    ],
    notes: [
      {
        id: "note-002",
        author: officer,
        content: "Need bank statements and tax return before analyst review can proceed.",
        createdAt: "2026-04-27T10:15:00.000Z",
        updatedAt: "2026-04-27T10:15:00.000Z"
      }
    ],
    statusHistory: [
      {
        id: "history-002-001",
        changedBy: borrowerProfiles[1].user,
        oldStatus: "DRAFT",
        newStatus: "SUBMITTED",
        createdAt: "2026-04-26T13:16:00.000Z"
      },
      {
        id: "history-002-002",
        changedBy: officer,
        oldStatus: "SUBMITTED",
        newStatus: "MORE_INFO_NEEDED",
        comment: "Bank statements and tax return are missing.",
        createdAt: "2026-04-27T10:20:00.000Z"
      }
    ],
    createdAt: "2026-04-26T13:00:00.000Z",
    updatedAt: "2026-04-27T10:20:00.000Z"
  },
  {
    id: "app-003",
    applicationNumber: "LNX-2026-003",
    loanType: "EQUIPMENT_FINANCE",
    status: "SUBMITTED",
    requestedAmount: 310000,
    currency: "USD",
    loanPurpose: "Equipment financing for a second production line.",
    requestedTermMonths: 84,
    borrowerProfile: borrowerProfiles[2],
    assignedOfficer: officer,
    documents: [],
    notes: [],
    statusHistory: [
      {
        id: "history-003-001",
        changedBy: borrowerProfiles[2].user,
        oldStatus: "DRAFT",
        newStatus: "SUBMITTED",
        comment: "Application submitted for equipment financing.",
        createdAt: "2026-04-29T16:40:00.000Z"
      }
    ],
    createdAt: "2026-04-29T16:40:00.000Z",
    updatedAt: "2026-04-29T16:40:00.000Z"
  }
];

export const requiredDocumentRules: RequiredDocumentRule[] = [
  {
    id: "rule-working-capital-id",
    loanType: "WORKING_CAPITAL",
    borrowerType: "BUSINESS",
    documentType: "ID",
    label: "Director identity document",
    description: "Government-issued ID for the primary applicant or director.",
    isRequired: true
  },
  {
    id: "rule-working-capital-bank",
    loanType: "WORKING_CAPITAL",
    borrowerType: "BUSINESS",
    documentType: "BANK_STATEMENT",
    label: "Last 3 months bank statements",
    description: "Required to assess cash flow consistency.",
    isRequired: true
  },
  {
    id: "rule-working-capital-tax",
    loanType: "WORKING_CAPITAL",
    borrowerType: "BUSINESS",
    documentType: "TAX_RETURN",
    label: "Most recent tax return",
    description: "Required before credit committee review.",
    isRequired: true
  },
  {
    id: "rule-equipment-finance-collateral",
    loanType: "EQUIPMENT_FINANCE",
    borrowerType: "BUSINESS",
    documentType: "COLLATERAL_DOCUMENT",
    label: "Equipment quote or collateral document",
    isRequired: true
  },
  {
    id: "rule-personal-id",
    loanType: "PERSONAL_LOAN",
    borrowerType: "INDIVIDUAL",
    documentType: "ID",
    label: "Borrower identity document",
    isRequired: true
  },
  {
    id: "rule-personal-bank",
    loanType: "PERSONAL_LOAN",
    borrowerType: "INDIVIDUAL",
    documentType: "BANK_STATEMENT",
    label: "Personal bank statements",
    isRequired: true
  }
];

export const agentTasks: AgentTask[] = [
  {
    id: "agent-task-001",
    loanApplicationId: "app-001",
    type: "BORROWER_FOLLOW_UP_DRAFT",
    status: "WAITING_FOR_APPROVAL",
    title: "Approve missing document follow-up",
    description: "Agent drafted a borrower email requesting the most recent tax return.",
    createdBy: officer,
    createdAt: "2026-05-01T09:15:00.000Z",
    updatedAt: "2026-05-01T09:15:00.000Z"
  },
  {
    id: "agent-task-002",
    loanApplicationId: "app-003",
    type: "MISSING_DOCUMENT_ANALYSIS",
    status: "PENDING",
    title: "Run equipment finance document check",
    description: "Application was submitted without required underwriting documents.",
    createdBy: officer,
    createdAt: "2026-05-01T10:30:00.000Z",
    updatedAt: "2026-05-01T10:30:00.000Z"
  }
];

export const missingDocumentChecklists: MissingDocumentChecklistItem[] = [
  {
    id: "checklist-001-tax",
    loanApplicationId: "app-001",
    requiredDocumentRuleId: "rule-working-capital-tax",
    documentType: "TAX_RETURN",
    label: "Most recent tax return",
    isSatisfied: false,
    createdAt: "2026-05-01T09:10:00.000Z",
    updatedAt: "2026-05-01T09:10:00.000Z"
  }
];

export const agentActionLogs: AgentActionLog[] = [
  {
    id: "agent-log-001",
    loanApplicationId: "app-001",
    agentTaskId: "agent-task-001",
    actionType: "INSPECT_APPLICATION",
    actor: officer,
    outputSummary: "Inspected borrower profile, loan request, uploaded documents, and existing AI summary.",
    createdAt: "2026-05-01T09:11:00.000Z"
  },
  {
    id: "agent-log-002",
    loanApplicationId: "app-001",
    agentTaskId: "agent-task-001",
    actionType: "GENERATE_CHECKLIST",
    actor: officer,
    outputSummary: "Generated missing document checklist with one required tax return item.",
    createdAt: "2026-05-01T09:12:00.000Z"
  },
  {
    id: "agent-log-003",
    loanApplicationId: "app-001",
    agentTaskId: "agent-task-001",
    actionType: "DRAFT_BORROWER_MESSAGE",
    actor: officer,
    outputSummary: "Drafted borrower follow-up email. Message remains unsent pending officer approval.",
    createdAt: "2026-05-01T09:15:00.000Z"
  },
  {
    id: "agent-log-004",
    loanApplicationId: "app-001",
    agentTaskId: "agent-task-001",
    actionType: "CREATE_APPROVAL_REQUEST",
    actor: officer,
    outputSummary: "Created officer approval request for editable borrower-facing message.",
    createdAt: "2026-05-01T09:16:00.000Z"
  }
];

export const conversations: Conversation[] = [
  {
    id: "conversation-001",
    loanApplicationId: "app-001",
    borrowerProfile: borrowerProfiles[0],
    channel: "EMAIL",
    subject: "Missing document request for LNX-2026-001",
    messages: [
      {
        id: "message-001-draft",
        conversationId: "conversation-001",
        author: officer,
        direction: "OUTBOUND",
        status: "PENDING_APPROVAL",
        subject: "Missing document request for LNX-2026-001",
        body:
          "Hi Amina,\n\nThanks for submitting your working capital application. To continue review, please upload the most recent business tax return for Rahman Specialty Foods LLC.\n\nOnce received, our credit team can complete the preliminary review.\n\nBest,\nDaniel",
        createdAt: "2026-05-01T09:16:00.000Z"
      },
      {
        id: "message-001-approved",
        conversationId: "conversation-001",
        author: officer,
        direction: "OUTBOUND",
        status: "APPROVED",
        subject: "Missing document request for LNX-2026-001",
        body:
          "Hi Amina,\n\nThanks for submitting your working capital application. Please upload the most recent business tax return so we can continue review.\n\nBest,\nDaniel",
        createdAt: "2026-05-01T09:22:00.000Z",
        approvedAt: "2026-05-01T09:24:00.000Z"
      }
    ],
    createdAt: "2026-05-01T09:16:00.000Z",
    updatedAt: "2026-05-01T09:24:00.000Z"
  }
];

export async function getApplications(): Promise<LoanApplication[]> {
  const provider = getAiProvider();

  return Promise.all(
    baseApplications.map(async (application) => ({
      ...application,
      aiAnalysis: application.aiAnalysis ?? (await provider.generateLoanAnalysis({ application }))
    }))
  );
}

export async function getApplicationById(id: string): Promise<LoanApplication | undefined> {
  const applications = await getApplications();
  return applications.find((application) => application.id === id);
}

export async function getApplicationMetrics() {
  const applications = await getApplications();
  const totalExposure = applications.reduce((sum, application) => sum + application.requestedAmount, 0);
  const highRisk = applications.filter((application) => application.aiAnalysis?.riskLevel === "HIGH").length;
  const needsInfo = applications.filter((application) => application.status === "MORE_INFO_NEEDED").length;

  return {
    totalApplications: applications.length,
    totalExposure,
    highRisk,
    needsInfo
  };
}

export const statusOptions: ApplicationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "MORE_INFO_NEEDED",
  "APPROVED",
  "REJECTED"
];
