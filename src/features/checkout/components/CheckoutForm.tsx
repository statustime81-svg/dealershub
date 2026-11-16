import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/formatters";
import type { CartQuote } from "@/features/cart/cart.schemas";
import {
  addressSchema,
  getCheckoutQuote,
  paymentPlans,
  type PaymentPlan,
  type ShippingAddress,
  type CheckoutInput,
} from "../order-terms.api";
const labels = {
  advance50: "50% advance",
  credit30: "30 days credit",
  credit60: "60 days credit",
  credit90: "90 days credit",
};
export function CheckoutForm({
  quote,
  busy,
  error,
  onSubmit,
  dealerId,
}: {
  quote: CartQuote;
  busy: boolean;
  error: string | null;
  onSubmit: (input: CheckoutInput) => Promise<void>;
  dealerId?: string;
}) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PaymentPlan | null>(null),
    [address, setAddress] = useState<ShippingAddress>({
      name: "",
      phone: "",
      address: "",
    }),
    [prefilled, setPrefilled] = useState(false);
  const current = useMemo(() => ({ plan, address }), [plan, address]);
  const deferred = useDebounce(current);
  const valid = addressSchema.safeParse(deferred.address);
  const changing =
    JSON.stringify(deferred) !== JSON.stringify({ plan, address });
  const calculated = useQuery({
    queryKey: [
      "user",
      user?.id,
      "checkout-quote",
      quote.storeId,
      dealerId,
      deferred,
      quote.fingerprint,
    ],
    queryFn: () =>
      getCheckoutQuote(
        quote.storeId,
        deferred.plan ?? "credit60",
        valid.success ? valid.data : null,
        dealerId,
      ),
    enabled: Boolean(quote.cartId),
    retry: false,
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    if (
      !prefilled &&
      calculated.data?.policy &&
      calculated.data.suggestedAddress
    ) {
      setAddress(calculated.data.suggestedAddress);
      setPrefilled(true);
    }
  }, [prefilled, calculated.data]);
  const q = calculated.data;
  const ready =
    Boolean(plan) &&
    q?.canSubmit &&
    !changing &&
    !calculated.isFetching &&
    !busy;
  const rows: [string, number | null][] = [
    ["Subtotal", q?.subtotal ?? quote.subtotal],
    ["Earned / applied discount", q?.discountTotal ?? null],
    [q?.taxIncluded ? "Tax (18%, included)" : "Tax (18%)", q?.taxTotal ?? null],
    ["Delivery", q?.deliveryTotal ?? null],
  ];
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready && plan && q?.cartId && q.fingerprint)
          void onSubmit({
            cartId: q.cartId,
            fingerprint: q.fingerprint,
            plan,
            address,
          }).finally(() => {
            void calculated.refetch();
          });
      }}
    >
      <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-lime-hover" />
          <h2 className="text-base font-semibold">Delivery address</h2>
        </div>
        <p className="text-xs leading-5 text-muted">
          Saved address is prefilled according to your supplier’s settings. Edit
          it for this order without changing the profile.
        </p>
        <fieldset disabled={busy} className="space-y-3">
          <Input
            label="Recipient / company"
            value={address.name}
            onChange={(event) =>
              setAddress((a) => ({ ...a, name: event.target.value }))
            }
            required
            maxLength={200}
            autoComplete="organization"
          />
          <Input
            label="Contact phone"
            type="tel"
            value={address.phone}
            onChange={(event) =>
              setAddress((a) => ({ ...a, phone: event.target.value }))
            }
            required
            minLength={6}
            maxLength={40}
            autoComplete="tel"
          />
          <Textarea
            label="Complete address, city, state and PIN"
            value={address.address}
            onChange={(event) =>
              setAddress((a) => ({ ...a, address: event.target.value }))
            }
            required
            minLength={5}
            maxLength={2000}
            autoComplete="street-address"
          />
        </fieldset>
      </section>
      <section className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Clock size={18} className="text-lime-hover" />
          <h2 className="text-base font-semibold">Payment terms</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {paymentPlans.map((item) => (
            <button
              type="button"
              key={item}
              disabled={busy}
              aria-pressed={plan === item}
              onClick={() => setPlan(item)}
              className={`rounded-xl border p-3 text-left transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none ${plan === item ? "border-lime-hover bg-lime/15" : "border-border bg-white hover:border-lime-hover/60"}`}
            >
              <strong className="block text-xs">{labels[item]}</strong>
              <span className="mt-1 block text-[11px] text-muted">
                {item === "advance50"
                  ? "5% benefit after qualifying payment"
                  : item === "credit30"
                    ? "10% per supplier terms"
                    : "No discount"}
              </span>
            </button>
          ))}
        </div>
        {q?.policy && (
          <p className="mt-3 text-xs leading-5 text-muted">
            Credit/balance days start from{" "}
            {q.policy.creditStart === "order"
              ? "order placement"
              : "delivery confirmation"}
            .
            {plan === "credit30" &&
              (q.policy.credit30Timing === "settlement"
                ? " 10% is earned only after eligible settlement within 30 days."
                : " 10% applies on selecting this plan.")}
            {plan === "advance50" &&
              ` Remaining balance is due in ${q.policy.advanceBalanceDays} days.`}
          </p>
        )}
      </section>
      <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
        <h2 className="text-base font-semibold">Order summary</h2>
        <dl className="space-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 text-xs">
              <dt className="text-muted">{label}</dt>
              <dd className="font-mono">
                {value === null ? "—" : formatCurrency(value)}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-lime/20 p-3">
          <strong className="text-sm">Current order total</strong>
          <strong className="font-mono text-base">
            {q?.total == null ? "Not configured" : formatCurrency(q.total)}
          </strong>
        </div>
        {q && q.potentialDiscount > q.discountTotal! && (
          <p className="text-xs leading-5 text-muted">
            Conditional discount: {formatCurrency(q.potentialDiscount)} on
            merchandise, applied after eligible payment is confirmed.
            {plan === "advance50" && q.advanceRequired != null
              ? ` Qualifying 50% advance: ${formatCurrency(q.advanceRequired)}.`
              : ""}{" "}
            Potential total after qualifying discount:{" "}
            {formatCurrency(q.potentialTotal ?? 0)}. Tax is recalculated when
            the discount is earned.
          </p>
        )}
        {q && !q.policy && (
          <p role="alert" className="text-xs text-danger">
            Supplier must complete Business settings → Checkout terms before
            orders can be placed.
          </p>
        )}
        {calculated.isError && (
          <div>
            <p role="alert" className="text-xs text-danger">
              {calculated.error instanceof Error
                ? calculated.error.message
                : "Unable to calculate checkout."}
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void calculated.refetch();
              }}
            >
              Retry quote
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        <Button
          className="w-full"
          type="submit"
          disabled={!ready}
          isLoading={busy}
        >
          {changing || calculated.isFetching
            ? "Updating total…"
            : "Place order"}
          <ArrowRight size={16} />
        </Button>
        <p className="flex items-start gap-2 text-xs leading-5 text-muted">
          <ShieldCheck size={15} className="mt-0.5 shrink-0" />
          Placing this order does not collect payment. Your manufacturer will
          confirm payments received and update your balance and discount.
        </p>
      </section>
    </form>
  );
}
