"use client";

import { useState } from "react";

export function ObraimsDocumentDownloadButton({
  applicationId,
  documentId
}: {
  applicationId: string;
  documentId: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function openSignedUrl() {
    setStatus("loading");

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/documents/${documentId}/signed-url`, {
        method: "GET",
        credentials: "same-origin"
      });

      if (!response.ok) {
        throw new Error("Unable to create signed URL.");
      }

      const payload = (await response.json()) as { signedUrl?: string };

      if (!payload.signedUrl) {
        throw new Error("Signed URL missing.");
      }

      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={openSignedUrl}
        disabled={status === "loading"}
        className="btn-secondary px-3 py-2 text-xs"
      >
        {status === "loading" ? "Creating link..." : "View"}
      </button>
      {status === "error" ? <span className="text-xs font-medium text-red-700">Access denied or link failed.</span> : null}
    </div>
  );
}
