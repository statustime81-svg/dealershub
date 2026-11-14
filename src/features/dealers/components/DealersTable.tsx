import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/Badge";

import { routeBuilders } from "@/config/routes";

import { formatDate } from "@/lib/formatters";

import { DealerAccessControls } from "./DealerAccessControls";

import type {
  DealerAccessRow,
} from "../dealers.api";

export function DealersTable({
  dealers,
}: {
  dealers: DealerAccessRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[760px] text-left text-sm">
        <caption className="sr-only">
          Dealers authorized for this store
        </caption>

        <thead className="bg-soft text-xs text-muted">
          <tr>
            {[
              "Dealer",
              "Phone",
              "Joined",
              "Access",
              "Actions",
            ].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="px-4 py-3"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {dealers.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-soft/50"
            >
              <td className="px-4 py-3">
                <Link
                  to={routeBuilders.manufacturerDealer(
                    row.dealer_id,
                  )}
                  className="font-medium hover:underline"
                >
                  {row.dealer.company_name}
                </Link>

                <p className="mt-1 max-w-xs truncate text-xs text-muted">
                  {row.dealer.address ?? "No address"}
                </p>
              </td>

              <td className="px-4 py-3">
                {row.dealer.contact_phone ?? "—"}
              </td>

              <td className="px-4 py-3">
                {formatDate(row.created_at)}
              </td>

              <td className="px-4 py-3">
                <Badge
                  variant={
                    row.status === "active"
                      ? "success"
                      : row.status === "pending"
                        ? "warning"
                        : row.status === "rejected"
                          ? "danger"
                          : "neutral"
                  }
                >
                  {row.status}
                </Badge>
              </td>

              <td className="px-4 py-3">
                <DealerAccessControls access={row} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}