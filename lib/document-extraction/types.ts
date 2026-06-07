import type { DocumentType } from "@/lib/types";

export type DocumentExtractionInput = {
  documentType: DocumentType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
};

export type DocumentExtractionResult = {
  provider: string;
  extractedText: string | null;
  metadata: Record<string, string | number | boolean>;
};

export interface DocumentExtractor {
  readonly name: string;
  extract(input: DocumentExtractionInput): Promise<DocumentExtractionResult>;
}
