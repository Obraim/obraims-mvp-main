import { MockDocumentExtractor } from "@/lib/document-extraction/mock-extractor";
import type { DocumentExtractor } from "@/lib/document-extraction/types";

export function getDocumentExtractor(): DocumentExtractor {
  const provider = process.env.DOCUMENT_EXTRACTOR_PROVIDER ?? "mock";

  switch (provider) {
    case "mock":
      return new MockDocumentExtractor();
    case "ocr":
      throw new Error("DOCUMENT_EXTRACTOR_PROVIDER=ocr is not implemented yet.");
    default:
      throw new Error(`Unsupported DOCUMENT_EXTRACTOR_PROVIDER: ${provider}`);
  }
}
