# Obraims MVP

Obraims is an AI-native loan origination and credit workflow platform. It helps lenders turn borrower applications and documents into structured loan files, AI-generated summaries, risk flags, and review-ready credit workflows.

The goal is not to replace loan officers. The MVP reduces manual work in borrower intake, document review, credit memo preparation, missing document tracking, and pipeline visibility.

## What is included

- Next.js App Router with TypeScript and Tailwind CSS
- Borrower-facing application form
- Borrower status page
- Local document upload API with basic metadata extraction
- Loan officer dashboard with status filtering
- Application detail review with AI summary, risk flags, missing documents, preliminary credit memo draft, follow-up questions, and status updates
- Admin overview for MVP users, applications, and role-management placeholder
- Prisma schema for PostgreSQL
- Prisma seed data
- Provider-agnostic AI service abstraction with a mock credit analysis provider
- Authentication placeholder with role-based demo entry points

## Project structure

```text
app/
  api/applications/[id]/documents/route.ts
  applications/new/page.tsx
  applications/[id]/documents/page.tsx
  applications/[id]/page.tsx
  admin/page.tsx
  borrower/page.tsx
  login/page.tsx
  officer/page.tsx
components/
lib/
  ai/
  validations/
prisma/
  schema.prisma
  seed.ts
uploads/
```

## Core database entities

The Prisma schema is centered on the requested lending workflow entities:

- `User` - borrower, loan officer, credit analyst, and admin identities
- `BorrowerProfile` - individual or business borrower details linked to a user
- `LoanApplication` - requested loan, status, assigned officer, and denormalized AI summary fields
- `Document` - uploaded loan file metadata, storage path, extraction text, and processing status
- `ApplicationNote` - internal review notes
- `StatusHistory` - audit trail for status changes
- `AiAnalysis` - provider/model outputs by analysis type: summary, risk flags, missing docs, and credit memo

## Setup

1. Install dependencies.

```bash
npm install
```

2. Create the `.env` file.

```bash
cp .env.example .env
```

3. Add `DATABASE_URL`.

Start PostgreSQL and set the connection string in `.env`.

Example local URL:

```env
DATABASE_URL="postgresql://obraims:obraims@localhost:5432/obraims?schema=public"
AI_PROVIDER="mock"
DOCUMENT_EXTRACTOR_PROVIDER="mock"
MAX_UPLOAD_MB="10"
```

4. Run the Prisma migration.

```bash
npx prisma migrate dev
```

5. Seed the database.

```bash
npx prisma db seed
```

6. Start the dev server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

The MVP uses demo role placeholders until real authentication is added:

- Borrower: `amina@example.com`
- Loan officer: `daniel@obraims.local`
- Credit analyst: `priya@obraims.local`
- Admin: `admin@obraims.local`

Seeded accounts use `obraims-demo` as the demo password hash source. The login page currently acts as a role entry screen, while server-side role checks live in `lib/security/access-control.ts`.

## Mock AI

The AI layer is provider-agnostic and defaults to `AI_PROVIDER="mock"`.

- `lib/ai/types.ts` defines the provider interface.
- `lib/ai/mock-provider.ts` returns deterministic mock summaries, risk scores, risk flags, missing documents, credit memo drafts, and follow-up questions.
- `lib/ai/prompts.ts` keeps prompt text separate from business logic.
- `lib/ai/index.ts` selects the provider from `AI_PROVIDER`.

To replace mock AI later:

1. Add a new provider class that implements `AiProvider`.
2. Read provider API keys from environment variables, never source code.
3. Add the provider case in `lib/ai/index.ts`.
4. Set `AI_PROVIDER` in `.env`.
5. Keep returned output compatible with `AiAnalysisResult`.

`AI_PROVIDER="openai"` and `AI_PROVIDER="gemini"` are reserved in `lib/ai/index.ts` and currently point to explicit placeholders. They do not make external calls yet.

## Mock document extraction

Document extraction is also provider-agnostic and defaults to `DOCUMENT_EXTRACTOR_PROVIDER="mock"`.

- `lib/document-extraction/types.ts` defines the extractor interface.
- `lib/document-extraction/mock-extractor.ts` returns safe metadata and defers OCR/text extraction.
- `lib/document-extraction/index.ts` selects the extractor from `DOCUMENT_EXTRACTOR_PROVIDER`.

To add OCR or document text extraction later:

1. Add a new extractor class that implements `DocumentExtractor`.
2. Read OCR provider configuration from environment variables.
3. Add the provider case in `lib/document-extraction/index.ts`.
4. Store extracted text and metadata through the document repository once Prisma-backed document writes are enabled.

## MVP notes

The current UI reads from typed demo data through `lib/repositories/loan-applications.ts` so the product flow is immediately explorable. The Prisma schema and seed script are ready for the next step: replacing the repository delegates with Prisma queries and adding real authentication sessions.

Uploaded files are written to `uploads/<application-id>/` in development. This is intentionally local for the MVP and can later be replaced by S3-compatible storage behind the same route boundary.

The first version intentionally does not include payments, complex underwriting models, bank integrations, or production KYC. The app includes clean placeholders where those capabilities can be added later.

The UI direction is a clean fintech SaaS dashboard: light backgrounds, charcoal text, subtle borders, rounded cards, status filters, risk badges, missing document checklists, AI summary panels, notes, and status history timelines.

## Security assumptions

- Server-side validation uses Zod for borrower intake, status updates, and document uploads.
- Secrets and provider configuration belong in environment variables, not source code.
- Demo role checks live in `lib/security/access-control.ts` and should be replaced by session-backed checks when Auth.js or another identity provider is added.
- Borrowers can only view their own applications.
- Loan officers can view and update assigned applications.
- Credit analysts and admins can view all applications in this MVP.
- Uploads validate document type, MIME type, and size. Configure limits with `MAX_UPLOAD_MB` and `ALLOWED_UPLOAD_MIME_TYPES`.
- API responses avoid returning local filesystem paths for uploaded files.

Security TODOs are tracked in `lib/security/todos.ts`:

- TODO: encryption at rest
- TODO: audit logging
- TODO: KYC/AML integration
- TODO: credit bureau integration
- TODO: data retention policies
- TODO: SOC 2 controls
- TODO: lender-specific approval matrix

## Demo routes

- `/` - landing page and workflow overview
- `/login` - authentication placeholder
- `/borrower` - borrower application status view
- `/applications/new` - borrower application form
- `/applications/app-004/documents` - document upload flow
- `/officer` - loan officer dashboard
- `/officer?status=IN_REVIEW` - filtered officer queue
- `/applications/app-001` - application detail review
- `/admin` - admin overview

## Next Milestones

- real authentication
- real file storage
- OCR/document text extraction
- OpenAI/Gemini AI provider
- credit memo export to PDF
- bank statement parser
- lender approval workflow
- audit logs

## Cloud deployment

For the fastest MVP cloud path, use Vercel for the Next.js app and Railway PostgreSQL for the database. See `DEPLOYMENT.md`.
