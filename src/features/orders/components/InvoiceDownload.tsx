import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { downloadOrderInvoice } from "../orders.api";
import type { OrderWorkspace } from "../orders.schemas";
function InvoiceButton({ document }: { document: OrderWorkspace["documents"][number] }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  async function download() {
    setBusy(true); setError(false);
    try {
      const blob = await downloadOrderInvoice(document.filePath);
      const url = URL.createObjectURL(blob); const anchor = window.document.createElement("a");
      anchor.href = url; anchor.download = document.fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_") || "invoice";
      window.document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError(true); } finally { setBusy(false); }
  }
  return <div><Button variant="secondary" size="sm" isLoading={busy} loadingText="Downloading…" onClick={() => { void download(); }}>Download {document.fileName}</Button>
    {error && <p role="alert" className="mt-2 text-xs text-danger">Invoice could not be downloaded. Check your access or try again.</p>}</div>;
}
export function InvoiceDownload({ documents }: { documents: OrderWorkspace["documents"] }) {
  return <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
    <h2 className="text-lg font-semibold">Available invoices</h2>
    {documents.length ? documents.map((document) => <InvoiceButton key={document.id} document={document} />)
      : <p className="text-sm text-muted">No invoice is available for this order yet.</p>}
  </section>;
}
