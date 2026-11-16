import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseClient } from "@/lib/supabase/client";
import { accountAdminAction } from "@/features/auth/account-admin.api";
import { loadRazorpay } from "@/features/payments/razorpay-test.api";
import { formatCurrency } from "@/lib/formatters";
const pendingSchema = z.object({
  attemptId: z.string().uuid(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});
type Pending = z.infer<typeof pendingSchema>;
const configSchema = z.object({
  mode: z.literal("test"),
  alreadyCaptured: z.literal(false),
  attemptId: z.string().uuid(),
  razorpayOrderId: z.string().startsWith("order_"),
  keyId: z.string().startsWith("rzp_test_"),
  amount: z.number().int().positive().safe(),
  currency: z.literal("INR"),
});
export function CheckoutTestPayment({
  orderId,
  amount,
  refresh,
}: {
  orderId: string;
  amount: number;
  refresh: () => Promise<void>;
}) {
  const { user } = useAuth();
  const request = useRef(crypto.randomUUID()),
    locked = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const storageKey = `dh-checkout-verification:${user?.id}:${orderId}`;
  const [pending, setPending] = useState<Pending | null>(() => {
    try {
      return pendingSchema
        .nullable()
        .parse(JSON.parse(sessionStorage.getItem(storageKey) ?? "null"));
    } catch {
      return null;
    }
  });
  const attempts = useQuery({
    queryKey: ["user", user?.id, "checkout-test-attempts", orderId],
    queryFn: async () => {
      const { data, error } = await getSupabaseClient()
        .from("checkout_test_payment_attempts")
        .select("id,status,razorpay_order_id")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return z
        .array(
          z.object({
            id: z.string(),
            status: z.string(),
            razorpay_order_id: z.string().nullable(),
          }),
        )
        .parse(data);
    },
    refetchInterval: 10000,
  });
  async function release() {
    locked.current = false;
    setBusy(false);
    await refresh();
    await attempts.refetch();
  }
  async function verify(payload: Pending) {
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await accountAdminAction(
        "verify-checkout-test-payment",
        payload,
      );
      if (result.success && result.status === "captured") {
        setPending(null);
        try {
          sessionStorage.removeItem(storageKey);
        } catch {
          /* Retry state remains memory-backed. */
        }
        request.current = crypto.randomUUID();
        setMessage(
          "Test payment verified. Simulated receipts, discount and balance updated. No real money collected.",
        );
      } else
        setMessage(
          "Payment capture is pending. Retry verification, not payment.",
        );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Verification failed. Do not pay again.",
      );
    } finally {
      await release();
    }
  }
  async function pay() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await loadRazorpay();
      const raw = await accountAdminAction("create-checkout-test-payment", {
        orderId,
        requestKey: request.current,
      });
      if (raw.alreadyCaptured) {
        request.current = crypto.randomUUID();
        setMessage(
          "Previous installment is already captured. Balances refreshed.",
        );
        await release();
        return;
      }
      const config = configSchema.parse(raw);
      if (!window.Razorpay) throw new Error("Checkout unavailable.");
      let returned = false;
      const checkout = new window.Razorpay({
        key: config.keyId,
        amount: config.amount,
        currency: "INR",
        order_id: config.razorpayOrderId,
        name: "DealersHub",
        description: "TEST installment — no real money",
        theme: { color: "#0b1220" },
        handler: (result) => {
          returned = true;
          const payload = { attemptId: config.attemptId, ...result };
          setPending(payload);
          try {
            sessionStorage.setItem(storageKey, JSON.stringify(payload));
          } catch {
            /* In-memory verification remains available. */
          }
          void verify(payload);
        },
        modal: {
          ondismiss: () => {
            if (!returned) {
              setMessage(
                "Checkout closed. Check payment status before retrying.",
              );
              void release();
            }
          },
        },
      });
      checkout.on("payment.failed", () =>
        setError(
          "A test payment failed. You can retry inside Checkout or close it and check status.",
        ),
      );
      checkout.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open payment.");
      request.current = crypto.randomUUID();
      await release();
    }
  }
  const authorized = attempts.data?.some((a) => a.status === "authorized");
  return (
    <section className="space-y-3 rounded-xl bg-lime/10 p-4">
      <span className="rounded-full bg-midnight px-2 py-1 text-[10px] font-semibold text-white">
        TEST MODE · NO REAL MONEY
      </span>
      <p className="text-xs leading-5 text-muted">
        Pay the server-calculated installment to test advance/credit discounts.
        Simulated amounts do not represent actual business receipts.
      </p>
      {pending ? (
        <Button
          size="sm"
          disabled={busy}
          onClick={() => {
            if (!locked.current) void verify(pending);
          }}
        >
          Retry verification
        </Button>
      ) : authorized ? (
        <p className="text-xs text-warning">
          Capture/verification is pending. Use the original payment callback or
          contact the administrator to reconcile; do not pay again.
        </p>
      ) : amount > 0 ? (
        <Button
          size="sm"
          isLoading={busy}
          disabled={!attempts.isSuccess}
          onClick={() => {
            void pay();
          }}
        >
          Pay {formatCurrency(amount)} in Test Mode
        </Button>
      ) : (
        <p className="text-xs font-medium text-success">
          No further simulated payment is due.
        </p>
      )}
      {attempts.isError && (
        <p className="text-xs text-danger">
          Payment state could not load. Check the phase 2 migration.
        </p>
      )}
      {message && (
        <p role="status" className="text-xs leading-5">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() => {
          void refresh();
          void attempts.refetch();
        }}
      >
        Refresh payment status
      </Button>
    </section>
  );
}
