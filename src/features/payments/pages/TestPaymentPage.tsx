import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/formatters";

import { TestPaymentPanel } from "../components/TestPaymentPanel";

const ordersSchema = z.array(
  z.object({
    id: z.string().uuid(),

    order_number: z
      .union([z.string(), z.number().int()])
      .transform(String),

    status: z.string(),

    total_amount: z.coerce.number().nonnegative(),

    currency: z.literal("INR").default("INR"),
  }),
);

export default function TestPaymentPage() {
  const { user } = useAuth();

  const [selected, setSelected] = useState("");

  const orders = useQuery({
    queryKey: [
      "user",
      user?.id,
      "test-payment-orders",
      "grand-total",
    ],

    enabled: Boolean(user),

    queryFn: async () => {
      const { data, error } = await getSupabaseClient()
        .from("orders")
        .select(
          "id,order_number,status,total_amount:grand_total",
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      return ordersSchema.parse(data);
    },
  });

  const order = orders.data?.find(
    (item) => item.id === selected,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <div>
        <span className="inline-flex rounded-md bg-lime/20 px-2 py-1 text-xs font-semibold">
          TEST MODE
        </span>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Test order payment
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted">
          Choose an existing order visible to your account.
          This page does not create orders or reduce stock.
          Test payments use INR.
        </p>

        <p className="mt-2 text-xs text-muted">
          Showing up to 100 recent orders.
        </p>
      </div>

      {orders.isPending && (
        <p role="status" className="text-sm text-muted">
          Loading saved orders…
        </p>
      )}

      {orders.isError && (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
          <p
            role="alert"
            className="text-sm leading-6 text-danger"
          >
            Saved orders could not load.
          </p>

          <p className="break-words text-xs leading-6 text-muted">
            {orders.error instanceof Error
              ? orders.error.message
              : "Check the orders query and database permissions."}
          </p>

          <Button
            variant="secondary"
            disabled={orders.isFetching}
            onClick={() => {
              void orders.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {orders.isSuccess && orders.data.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <Select
            label="Saved order"
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value);
            }}
          >
            <option value="">Select an order</option>

            {orders.data.map((item) => (
              <option key={item.id} value={item.id}>
                {item.order_number} ·{" "}
                {formatCurrency(item.total_amount)} ·{" "}
                {item.status}
              </option>
            ))}
          </Select>
        </div>
      )}

      {orders.isSuccess && orders.data.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold">
            No saved orders found
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            No orders are visible to this account.
            An existing order is required before testing payment.
          </p>

          <Button
            variant="secondary"
            className="mt-4"
            disabled={orders.isFetching}
            onClick={() => {
              void orders.refetch();
            }}
          >
            Refresh orders
          </Button>
        </div>
      )}

      {order && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-5">
            <div>
              <p className="text-xs text-muted">
                Selected order
              </p>

              <p className="mt-1 break-all text-sm font-medium">
                {order.order_number}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted">
                Saved order total
              </p>

              <p className="mt-1 font-mono text-lg font-semibold">
                {formatCurrency(order.total_amount)}
              </p>
            </div>
          </div>

          <TestPaymentPanel
            key={`${user?.id}:${order.id}`}
            orderId={order.id}
            orderStatus={order.status}
          />
        </>
      )}
    </div>
  );
}