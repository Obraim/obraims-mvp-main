export type UserRole = "BORROWER" | "LOAN_OFFICER" | "CREDIT_ANALYST" | "ADMIN";

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "MORE_INFO_NEEDED"
  | "APPROVED"
  | "REJECTED";

export type BorrowerType = "INDIVIDUAL" | "BUSINESS";

export type LoanType =
  | "BUSINESS_LOAN"
  | "PERSONAL_LOAN"
  | "MORTGAGE"
  | "WORKING_CAPITAL"
  | "EQUIPMENT_FINANCE";

export type DocumentType =
  | "ID"
  | "BANK_STATEMENT"
  | "FINANCIAL_STATEMENT"
  | "TAX_RETURN"
  | "BUSINESS_REGISTRATION"
  | "COLLATERAL_DOCUMENT"
  | "CONTRACT"
  | "OTHER";

export type DocumentStatus = "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type AgentTaskType =
  | "MISSING_DOCUMENT_ANALYSIS"
  | "BORROWER_FOLLOW_UP_DRAFT"
  | "INTERNAL_NOTE_DRAFT"
  | "OFFICER_APPROVAL_REQUEST";

export type AgentTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "WAITING_FOR_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export type AgentActionType =
  | "INSPECT_APPLICATION"
  | "COMPARE_REQUIRED_DOCUMENTS"
  | "GENERATE_CHECKLIST"
  | "DRAFT_BORROWER_MESSAGE"
  | "CREATE_INTERNAL_NOTE"
  | "CREATE_APPROVAL_REQUEST";

export type ConversationChannel = "EMAIL" | "SMS" | "WHATSAPP" | "TELEGRAM" | "IN_APP";

export type MessageDirection = "INBOUND" | "OUTBOUND" | "INTERNAL";

export type MessageStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SENT";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferredLanguage?: "en";
};

export type LoanDocument = {
  id: string;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  extractedText?: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationNote = {
  id: string;
  author: UserSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type StatusHistoryEntry = {
  id: string;
  changedBy: UserSummary;
  oldStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  comment?: string;
  createdAt: string;
};

export type RequiredDocumentRule = {
  id: string;
  loanType: LoanType;
  borrowerType: BorrowerType;
  documentType: DocumentType;
  label: string;
  description?: string;
  isRequired: boolean;
};

export type MissingDocumentChecklistItem = {
  id: string;
  loanApplicationId: string;
  requiredDocumentRuleId?: string;
  documentType: DocumentType;
  label: string;
  isSatisfied: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AgentTask = {
  id: string;
  loanApplicationId: string;
  type: AgentTaskType;
  status: AgentTaskStatus;
  title: string;
  description?: string;
  createdBy?: UserSummary;
  approvedBy?: UserSummary;
  createdAt: string;
  updatedAt: string;
};

export type AgentActionLog = {
  id: string;
  loanApplicationId: string;
  agentTaskId?: string;
  actionType: AgentActionType;
  actor?: UserSummary;
  outputSummary: string;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  author?: UserSummary;
  direction: MessageDirection;
  status: MessageStatus;
  subject?: string;
  body: string;
  createdAt: string;
  approvedAt?: string;
  sentAt?: string;
};

export type Conversation = {
  id: string;
  loanApplicationId: string;
  borrowerProfile: BorrowerProfileSummary;
  channel: ConversationChannel;
  subject: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

export type BorrowerProfileSummary = {
  id: string;
  user: UserSummary;
  borrowerType: BorrowerType;
  legalName: string;
  registrationNumber?: string;
  phone: string;
  address: string;
  industry?: string;
  annualRevenue?: number;
};

export type AiAnalysisResult = {
  provider: string;
  model: string;
  summary: string;
  creditMemoDraft: string;
  riskLevel: RiskLevel;
  riskScore: number;
  riskFlags: string[];
  missingDocuments: DocumentType[];
  recommendedActions: string[];
  followUpQuestions: string[];
};

export type LoanApplication = {
  id: string;
  applicationNumber: string;
  loanType: LoanType;
  status: ApplicationStatus;
  requestedAmount: number;
  currency: string;
  loanPurpose: string;
  requestedTermMonths: number;
  borrowerProfile: BorrowerProfileSummary;
  assignedOfficer?: UserSummary;
  documents: LoanDocument[];
  notes: ApplicationNote[];
  statusHistory: StatusHistoryEntry[];
  aiAnalysis?: AiAnalysisResult;
  createdAt: string;
  updatedAt: string;
};
