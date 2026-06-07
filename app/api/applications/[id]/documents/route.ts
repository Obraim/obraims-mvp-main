import { NextResponse } from "next/server";
import { getCurrentUser, isSuperAdmin } from "@/src/lib/obraims/access-control";
import { uploadApplicationDocument, type IntakeDocumentType } from "@/src/lib/obraims/simple-core";
import { documentTypeSchema, validateUploadedFile } from "@/lib/validations/document";

const documentTypeMap: Record<string, IntakeDocumentType> = {
  ID: "national_id",
  BANK_STATEMENT: "bank_statement",
  CREDIT_BUREAU: "credit_bureau",
  FINANCIAL_STATEMENT: "income_proof",
  TAX_RETURN: "income_proof",
  BUSINESS_REGISTRATION: "business_registration",
  COLLATERAL_DOCUMENT: "collateral_document",
  LOAN_AGREEMENT: "loan_agreement",
  OTHER_STATEMENT: "other_statement",
  CONTRACT: "other",
  OTHER: "other"
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!(await isSuperAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const documentType = documentTypeSchema.safeParse(formData.get("documentType"));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Document file is required." }, { status: 400 });
  }

  if (!documentType.success) {
    return NextResponse.json({ error: "Unsupported document type." }, { status: 400 });
  }

  const validFile = validateUploadedFile(file);

  if (!validFile.success) {
    return NextResponse.json({ error: validFile.error.issues[0]?.message ?? "Invalid file." }, { status: 400 });
  }

  try {
    const result = await uploadApplicationDocument({
      loanApplicationId: params.id,
      documentType: documentTypeMap[documentType.data],
      file,
      audit: {
        actorType: "admin",
        actorId: user.id,
        metadata: {
          action_source: "document_upload_api"
        }
      }
    });

    return NextResponse.json({
      id: result.document.id,
      loanApplicationId: params.id,
      documentType: documentType.data,
      fileName: result.document.file_name,
      storageKey: result.document.file_path,
      mimeType: result.document.mime_type,
      fileSize: result.document.file_size_bytes,
      status: result.document.status,
      createdAt: result.document.created_at,
      updatedAt: result.document.updated_at
    });
  } catch (error) {
    console.error("Document upload API failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload document." },
      { status: 400 }
    );
  }
}
