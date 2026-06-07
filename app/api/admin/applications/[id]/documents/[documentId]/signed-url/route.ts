import { NextResponse } from "next/server";
import { getCurrentUser, isSuperAdmin } from "@/src/lib/obraims/access-control";
import { createSignedDocumentUrl } from "@/src/lib/obraims/simple-core";

export async function GET(
  _request: Request,
  {
    params
  }: {
    params: { id: string; documentId: string };
  }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!(await isSuperAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const result = await createSignedDocumentUrl({
    loanApplicationId: params.id,
    documentId: params.documentId,
    expiresInSeconds: 60,
    audit: {
      actorType: "admin",
      actorId: user.id,
      metadata: {
        action_source: "admin_signed_document_url_api"
      }
    }
  });

  if (!result) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({
    signedUrl: result.signedUrl,
    expiresInSeconds: result.expiresInSeconds,
    document: {
      id: result.document.id,
      fileName: result.document.file_name,
      documentType: result.document.document_type,
      mimeType: result.document.mime_type,
      fileSizeBytes: result.document.file_size_bytes
    }
  });
}
