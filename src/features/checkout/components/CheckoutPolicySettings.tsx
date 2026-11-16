import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getCheckoutPolicy, policySchema, termsRpc } from "../order-terms.api";
function PolicyEditor({
  businessId,
  saved,
}: {
  businessId: string;
  saved: Awaited<ReturnType<typeof getCheckoutPolicy>>;
}) {
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const c = saved?.config;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setError("");
    setMessage("");
    const value = policySchema.safeParse({
      paymentMode: "manual",
      taxMode: f.get("taxMode"),
      taxDelivery: f.get("taxDelivery") === "yes",
      advanceBase: f.get("advanceBase"),
      advanceBalanceDays: Number(f.get("advanceBalanceDays")),
      credit30Timing: f.get("credit30Timing"),
      creditStart: f.get("creditStart"),
      stockPoint: f.get("stockPoint"),
      addressSource: f.get("addressSource"),
      deliveryFee: Number(f.get("deliveryFee")),
    });
    if (!value.success) {
      setError(value.error.issues[0]?.message ?? "Complete all settings.");
      return;
    }
    setBusy(true);
    try {
      await termsRpc("save_checkout_policy", {
        p_business_id: businessId,
        p_expected_revision: saved?.revision ?? 0,
        p_config: value.data,
      });
      setMessage("Checkout terms saved.");
      void cache.invalidateQueries();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-border bg-white p-5"
    >
      <div>
        <h2 className="text-lg font-semibold">Checkout terms</h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          Tax is fixed at 18%. Confirm the remaining business rules before
          enabling order placement. Existing orders retain their saved terms.
        </p>
      </div>
      <fieldset disabled={busy} className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-soft p-4 text-sm"><strong>Manual payment confirmation</strong><p className="mt-1 text-xs text-muted">The manufacturer records actual receipts. No online payment gateway is used.</p></div>
        <Select
          name="taxMode"
          label="Tax (18%) pricing"
          defaultValue={c?.taxMode ?? ""}
          required
        >
          <option value="" disabled>
            Select
          </option>
          <option value="extra">Add 18% to listed prices</option>
          <option value="included">Listed prices already include 18%</option>
        </Select>
        <Select
          name="taxDelivery"
          label="Apply tax to delivery fee?"
          defaultValue={c ? (c.taxDelivery ? "yes" : "no") : ""}
          required
        >
          <option value="" disabled>
            Select
          </option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </Select>
        <Select
          name="advanceBase"
          label="5% discount after 50% payment applies to"
          defaultValue={c?.advanceBase ?? ""}
          required
        >
          <option value="" disabled>
            Select
          </option>
          <option value="order">Entire merchandise amount</option>
          <option value="advance">50% of merchandise amount only</option>
        </Select>
        <Input
          name="advanceBalanceDays"
          label="Advance plan: remaining balance due in days"
          type="number"
          min={1}
          max={365}
          step={1}
          defaultValue={c?.advanceBalanceDays ?? ""}
          required
        />
        <Select
          name="credit30Timing"
          label="30-day plan: 10% discount eligibility"
          defaultValue={c?.credit30Timing ?? ""}
          required
        >
          <option value="" disabled>
            Select
          </option>
          <option value="selection">Apply on choosing the 30-day plan</option>
          <option value="settlement">
            Earn only when settled within 30 days
          </option>
        </Select>
        <Select
          name="creditStart"
          label="Balance/credit days start from"
          defaultValue={c?.creditStart ?? ""}
          required
        >
          <option value="" disabled>
            Select
          </option>
          <option value="order">Order placement</option>
          <option value="delivery">Delivery confirmation</option>
        </Select>
        <Input
          name="deliveryFee"
          label="Fixed delivery fee per order (₹; enter 0 if free)"
          type="number"
          min={0}
          max={1000000}
          step="0.01"
          defaultValue={c?.deliveryFee ?? ""}
          required
        />
        <Select
          name="stockPoint"
          label="Deduct tracked inventory when"
          defaultValue={c?.stockPoint ?? ""}
          required
        >
          <option value="" disabled>
            Select
          </option>
          <option value="placement">Order is placed</option>
          <option value="confirmation">Manufacturer confirms order</option>
          <option value="dispatch">Order is dispatched</option>
        </Select>
        <Select
          name="addressSource"
          label="Default editable delivery address"
          defaultValue={c?.addressSource ?? ""}
          required
        >
          <option value="" disabled>
            Select
          </option>
          <option value="manufacturer">Manufacturer business address</option>
          <option value="dealer">Dealer profile address</option>
        </Select>
      </fieldset>
      <p className="text-xs text-muted">
        60-day and 90-day plans have no discount. Conditional discounts apply
        after eligible verified payment. Test-mode receipts and balances are
        explicitly simulated; they never represent actual received funds.
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-success">
          {message}
        </p>
      )}
      <Button type="submit" isLoading={busy}>
        Save checkout terms
      </Button>
    </form>
  );
}
export function CheckoutPolicySettings({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["user", user?.id, "checkout-policy", businessId],
    queryFn: () => getCheckoutPolicy(businessId),
  });
  if (q.isPending)
    return <p className="text-sm text-muted">Loading checkout terms…</p>;
  if (q.isError)
    return (
      <div>
        <p className="text-sm text-danger">
          Checkout terms could not load. Run the phase 2 migration first.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            void q.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  return (
    <PolicyEditor
      key={`${businessId}:${q.data?.revision ?? 0}`}
      businessId={businessId}
      saved={q.data}
    />
  );
}
