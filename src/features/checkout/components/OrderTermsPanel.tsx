import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Truck, MapPin, Copy, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { routeBuilders } from "@/config/routes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import {
  getOrderTerms,
  safeTrackingUrl,
  termsRpc,
  type OrderTerms,
} from "../order-terms.api";
const labels = {
  advance50: "50% advance",
  credit30: "30 days credit",
  credit60: "60 days credit",
  credit90: "90 days credit",
};
function localTime() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
function ReceiptForm({
  orderId,
  refresh,
}: {
  orderId: string;
  refresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const request = useRef<{ signature: string; key: string } | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget,
      f = new FormData(form);
    setError("");
    setMessage("");
    const amount = Number(f.get("amount")),
      reference = String(f.get("reference") ?? "").trim(),
      received = new Date(String(f.get("receivedAt") ?? ""));
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isFinite(received.getTime()) ||
      f.get("confirmed") !== "on"
    ) {
      setError("Confirm the actual received amount, date and reference.");
      return;
    }
    const signature = JSON.stringify({
      amount,
      reference,
      receivedAt: received.toISOString(),
    });
    if (request.current?.signature !== signature)
      request.current = { signature, key: crypto.randomUUID() };
    setBusy(true);
    try {
      await termsRpc("record_order_receipt", {
        p_order_id: orderId,
        p_request_key: request.current.key,
        p_amount: amount,
        p_reference: reference,
        p_received_at: received.toISOString(),
      });
      form.reset();
      request.current = null;
      setMessage(
        "Receipt recorded. Eligible discounts and balance recalculated.",
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to record receipt.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-soft p-4">
      <h3 className="text-sm font-semibold">Confirm received payment</h3>
      <p className="text-xs leading-5 text-muted">
        Record only funds actually received by your business. Receipt entries cannot be edited here.
      </p>
      <fieldset disabled={busy} className="space-y-3">
        <Input
          name="amount"
          label="Amount received (₹)"
          type="number"
          min="0.01"
          max="999999999999.99"
          step="0.01"
          required
        />
        <Input
          name="reference"
          label="Unique bank / cash receipt reference"
          required
          maxLength={200}
        />
        <Input
          name="receivedAt"
          label="Received at"
          type="datetime-local"
          defaultValue={localTime()}
          required
        />
        <Checkbox
          name="confirmed"
          label="I confirm these funds were actually received"
          required
        />
      </fieldset>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-xs text-success">
          {message}
        </p>
      )}
      <Button size="sm" type="submit" isLoading={busy}>
        Confirm receipt
      </Button>
    </form>
  );
}
function ShipmentForm({
  orderId,
  data,
  refresh,
}: {
  orderId: string;
  data: OrderTerms;
  refresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget),
      url = String(f.get("url") ?? "").trim();
    setError("");
    if (url && !safeTrackingUrl(url)) {
      setError("Use an HTTPS courier tracking URL.");
      return;
    }
    setBusy(true);
    try {
      await termsRpc("save_order_shipment", {
        p_order_id: orderId,
        p_expected_updated_at: data.shipping_updated_at,
        p_carrier: String(f.get("carrier") ?? "").trim(),
        p_awb: String(f.get("awb") ?? "").trim(),
        p_url: url,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save shipment.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-soft p-4">
      <h3 className="text-sm font-semibold">Courier information</h3>
      <fieldset disabled={busy} className="space-y-3">
        <Input
          name="carrier"
          label="Courier / transporter"
          defaultValue={data.carrier ?? ""}
          maxLength={150}
        />
        <Input
          name="awb"
          label="AWB / consignment number"
          defaultValue={data.awb ?? ""}
          maxLength={150}
        />
        <Input
          name="url"
          label="Courier tracking URL (HTTPS)"
          type="url"
          defaultValue={data.tracking_url ?? ""}
          maxLength={2000}
        />
      </fieldset>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <Button size="sm" type="submit" isLoading={busy}>
        Save shipment details
      </Button>
    </form>
  );
}
export function OrderTermsPanel({
  orderId,
  canManage = false,
  trackingOnly = false,
  orderStatus,
}: {
  orderId: string;
  canManage?: boolean;
  trackingOnly?: boolean;
  orderStatus?: string;
}) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [copied, setCopied] = useState(false),
    [copyError, setCopyError] = useState(false);
  const q = useQuery({
    queryKey: ["user", user?.id, "checkout-order", orderId],
    queryFn: () => getOrderTerms(orderId),
    refetchInterval: 15000,
    retry: false,
  });
  async function refresh() {
    await Promise.all([
      q.refetch(),
      cache.invalidateQueries({
        queryKey: ["user", user?.id, "order-workspace", orderId],
      }),
      cache.invalidateQueries({ queryKey: ["user", user?.id, "orders"] }),
      cache.invalidateQueries({
        queryKey: ["user", user?.id, "order-confirmation", orderId],
      }),
    ]);
  }
  if (q.isPending)
    return <p className="text-xs text-muted">Loading order terms…</p>;
  if (q.isError)
    return (
      <div>
        <p className="text-xs text-danger">Order terms could not load.</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void q.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  if (!q.data) return null;
  const d = q.data,
    external = safeTrackingUrl(d.tracking_url);
  const tracking = routeBuilders.orderTracking(orderId);
  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-lime-hover" />
          <h2 className="text-base font-semibold">Delivery address</h2>
        </div>
        <p className="text-sm font-medium">{d.shipping_address.name}</p>
        <p className="text-xs text-muted">{d.shipping_address.phone}</p>
        <p className="whitespace-pre-line text-sm leading-6">
          {d.shipping_address.address}
        </p>
      </section>
      {!trackingOnly && (
        <section className="space-y-3 rounded-2xl border border-border bg-white p-5">
          <h2 className="text-base font-semibold">Payment & credit</h2>
          <p className="text-sm font-medium">{labels[d.plan]}</p>
          <dl className="space-y-2 text-xs">
            {[
              [d.testMode ? "Test order total" : "Current total", d.total],
              [
                d.testMode ? "Simulated receipts" : "Confirmed receipts",
                d.paid_total,
              ],
              ["Earned / applied discount", d.earned_discount],
              [
                d.testMode ? "Simulated balance" : "Outstanding balance",
                d.remaining,
              ],
              ["Customer credit / refund to review", d.creditBalance],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-3">
                <dt className="text-muted">{label}</dt>
                <dd className="font-mono">{formatCurrency(Number(value))}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs leading-5 text-muted">
            Tax: 18% {d.taxIncluded ? "included in prices" : "added to prices"}.
            Due:{" "}
            {d.due_at
              ? formatDateTime(d.due_at)
              : "Starts after delivery confirmation"}
            .
          </p>
          {d.initial_quote.potentialDiscount > d.earned_discount && (
            <p className="text-xs leading-5 text-muted">
              Potential conditional discount:{" "}
              {formatCurrency(d.initial_quote.potentialDiscount)}. It is not
              earned until qualifying receipt is confirmed.
              {d.plan === "advance50" && d.initial_quote.advanceRequired != null
                ? ` Required advance: ${formatCurrency(d.initial_quote.advanceRequired)}.`
                : ""}
            </p>
          )}
          {["rejected", "cancelled"].includes(orderStatus ?? "") && (
            <p className="text-xs leading-5 text-warning">
              This order is closed. No further payment is due; any received
              amount needs a separate refund review.
            </p>
          )}
          {d.creditBalance > 0 && (
            <p className="text-xs text-warning">
              Credit requires manufacturer review; no automatic refund has been
              issued.
            </p>
          )}
          {d.receipts.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              {d.receipts.map((item) => (
                <div key={item.id} className="text-xs">
                  <strong>{formatCurrency(item.amount)}</strong>
                  <span className="ml-2 break-all text-muted">
                    {item.reference}
                  </span>
                  <p className="mt-1 text-muted">
                    {formatDateTime(item.receivedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
          {canManage &&
            !d.testMode &&
            !["rejected", "cancelled"].includes(orderStatus ?? "") && (
              <ReceiptForm orderId={orderId} refresh={refresh} />
            )}
          {!canManage && !d.testMode && (
            <p className="text-xs leading-5 text-muted">Pay using the arrangements agreed with the manufacturer. The manufacturer will record and confirm the amount received here.</p>
          )}
          {d.testMode && <p className="text-xs leading-5 text-warning">Archived simulated order. Payment collection is disabled. Create a new order for actual payment records.</p>}
        </section>
      )}
      <section className="space-y-3 rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center gap-2">
          <Truck size={18} className="text-lime-hover" />
          <h2 className="text-base font-semibold">Track your order</h2>
        </div>
        <p className="text-xs leading-5 text-muted">
          Order history updates as the manufacturer confirms, processes and
          dispatches your order. The order link requires an authorized login.
        </p>
        {d.carrier && <p className="text-sm">Courier: {d.carrier}</p>}
        {d.awb && <p className="break-all font-mono text-xs">AWB: {d.awb}</p>}
        {external && (
          <a
            href={external}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-info"
          >
            Open courier tracking <ExternalLink size={14} />
          </a>
        )}
        <div className="flex flex-wrap gap-2">
          <Link
            to={tracking}
            className="inline-flex min-h-10 items-center rounded-lg bg-lime px-3 text-xs font-semibold text-midnight"
          >
            Open tracking page
          </Link>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setCopyError(false);
              void navigator.clipboard
                .writeText(new URL(tracking, window.location.origin).href)
                .then(() => setCopied(true))
                .catch(() => setCopyError(true));
            }}
          >
            <Copy size={14} />
            {copied ? "Link copied" : "Copy tracking link"}
          </Button>
        </div>
        {copyError && (
          <p className="break-all text-xs text-muted">
            Copy this link: {new URL(tracking, window.location.origin).href}
          </p>
        )}
        {canManage && (
          <ShipmentForm
            key={d.shipping_updated_at ?? "new"}
            orderId={orderId}
            data={d}
            refresh={refresh}
          />
        )}
      </section>
    </div>
  );
}
