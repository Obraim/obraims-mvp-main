# Obraims Context

## What Obraims Is

Obraims is an AI-assisted lending MVP.

Its first goal is to make loan request capture and review easier.

The MVP should support:

- Simple borrower intake
- AI/chat-assisted loan request capture
- Admin review
- Mock decisioning
- Loan offer generation
- Application status visibility
- Audit trail

Obraims is not yet a full loan management system.

## Architecture

Current stack:

- Frontend: Next.js
- Backend/data: Supabase
- Hosting: Vercel
- Language: TypeScript

## Data Model Philosophy

Obraims uses a lightweight ontology-inspired structure called:

```text
Obraims Simple Core v1
```

This is not a full Palantir-style ontology.

It is a simple lending data backbone.

The source-of-truth tables are:

```text
customers
loan_applications
documents
consents
decisions
decision_reasons
loan_offers
ai_conversations
audit_events
```

## Core Object Model

```text
Customer
  └── LoanApplication
        ├── Consent
        ├── Documents
        ├── Decision
        │     └── DecisionReasons
        ├── LoanOffer
        ├── AIConversation
        └── AuditEvents
```

## Core Flow

```text
Customer starts application
→ consent granted
→ loan application created
→ application submitted
→ admin/mock decision created
→ decision reasons created
→ loan offer generated if approved
→ customer views status/offer
→ audit events record important actions
```

## Database Contract

Future development must preserve the existing schema.

Do not create duplicate concepts.

Examples:

| Concept | Correct Table | Do Not Create |
|---|---|---|
| Borrower | `customers` | `users`, `borrowers`, `applicants` |
| Loan request | `loan_applications` | `applications`, `requests` |
| Uploaded files | `documents` | `files`, `uploads` |
| Consent | `consents` | `permissions`, `agreements` |
| Decision | `decisions` | `reviews`, `approvals` |
| Decision explanation | `decision_reasons` | `reasons`, `rejection_reasons` |
| Offer | `loan_offers` | `offers` |
| Chat | `ai_conversations` | `chats`, `messages` |
| Audit trail | `audit_events` | `logs`, `activity_logs` |

## Current Key Routes

Expected routes:

```text
/app/apply
/app/application/[id]
/app/admin/applications
```

## Current Helper Files

Expected helper files:

```text
src/lib/obraims/simple-core.ts
src/lib/obraims/mock-decision.ts
```

## Design Rules

1. Keep the MVP simple.
2. Use existing Simple Core v1 tables.
3. Prefer `metadata jsonb` for minor extensions.
4. Add migrations only when necessary.
5. Keep privileged actions server-side.
6. Never expose service role key to the frontend.
7. Write audit events for important actions.
8. Do not build real underwriting until required.
9. Do not create a second data model.
10. Build features around the existing lending workflow.

## Near-Term Roadmap

### Now

- Polish application form
- Polish application detail page
- Polish admin application dashboard
- Verify audit events
- Add chat-based application capture

### Later

- Document upload improvements
- Real KYC provider
- Bank statement parsing
- Credit bureau integration
- Manual underwriting workflow
- Loan contracts
- Payments
- Repayment schedules
- Collections

## Current Priority

The current priority is:

```text
Make Obraims excellent at capturing and reviewing loan applications.
```

The next high-value feature is:

```text
Chat-based loan application capture using the existing Simple Core v1 schema.
```
