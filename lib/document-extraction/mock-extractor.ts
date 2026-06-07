import type {
  DocumentExtractionInput,
  DocumentExtractionResult,
  DocumentExtractor
} from "@/lib/document-extraction/types";

export class MockDocumentExtractor implements DocumentExtractor {
  readonly name = "mock";

  async extract(input: DocumentExtractionInput): Promise<DocumentExtractionResult> {
    const extension = input.fileName.includes(".") ? input.fileName.split(".").pop()?.toLowerCase() : "unknown";

    return {
      provider: this.name,
      extractedText: null,
      metadata: {
        documentType: input.documentType,
        extension: extension ?? "unknown",
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        storageKey: input.storageKey,
        extractionStatus: "deferred"
      }
    };
  }
}
