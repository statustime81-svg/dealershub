import { Badge } from "@/components/ui/Badge";

import {
  formatCurrency,
  formatDateTime,
} from "@/lib/formatters";

import { orderStatuses } from "@/config/order-statuses";

import { DealerAccessControls } from "./DealerAccessControls";

import type {
  getDealerDetails,
} from "../dealers.api";

type DealerDetails = Awaited<
  ReturnType<typeof getDealerDetails>
>;

export function DealerProfilePanel({
  details,
}: {
  details: DealerDetails;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">
          Dealer information
        </h2>

        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">
              Phone
            </dt>
            <dd className="mt-1">
              {details.dealer.contact_phone ?? "—"}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-muted">
              GSTIN
            </dt>
            <dd className="mt-1 font-mono">
              {details.dealer.gstin ?? "—"}
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-xs text-muted">
              Address
            </dt>
            <dd className="mt-1 whitespace-pre-line">
              {details.dealer.address ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">
          Store access
        </h2>

        <div className="mt-4 space-y-4">
          {details.access.map((access) => (
            <div
              key={access.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4"
            >
              <div>
                <p className="text-xs text-muted">
                  Store ID
                </p>

                <p className="mt-1 break-all font-mono text-xs">
                  {access.store_id}
                </p>

                <Badge className="mt-2">
                  {access.status}
                </Badge>
              </div>

              <DealerAccessControls access={access} />
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <h2 className="px-5 pt-5 text-lg font-semibold">
          Recent orders
        </h2>

        <p className="px-5 pb-4 pt-1 text-xs text-muted">
          Latest 20 orders for this business.
        </p>

        {details.recentOrders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-soft text-xs text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Order
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Amount
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Ordered on
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {details.recentOrders.map((order) => {
                  const status =
                    orderStatuses[order.status];

                  return (
                    <tr key={order.id}>
                      <td className="px-5 py-3 font-mono text-xs">
                        ORD-{order.order_number}
                      </td>

                      <td className="px-5 py-3 font-mono text-xs">
                        {formatCurrency(
                          order.grand_total,
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </td>

                      <td className="px-5 py-3 text-xs">
                        {formatDateTime(
                          order.created_at,
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 pb-5 text-sm text-muted">
            No orders found.
          </p>
        )}
      </section>
    </div>
  );
}