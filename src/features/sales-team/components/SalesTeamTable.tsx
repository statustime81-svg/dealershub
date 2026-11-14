import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/Badge";

import { routeBuilders } from "@/config/routes";

import { formatDate } from "@/lib/formatters";

import type {
  SalespersonRow,
} from "../sales-team.api";

export function SalesTeamTable({
  salespeople,
}: {
  salespeople: SalespersonRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[620px] text-left text-sm">
        <caption className="sr-only">
          Business sales team
        </caption>

        <thead className="bg-soft text-xs text-muted">
          <tr>
            {[
              "Salesperson",
              "Phone",
              "Joined",
              "Status",
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
          {salespeople.map((person) => (
            <tr
              key={person.id}
              className="hover:bg-soft/50"
            >
              <td className="px-4 py-3">
                <Link
                  to={routeBuilders.manufacturerSalesperson(
                    person.user_id,
                  )}
                  className="font-medium hover:underline"
                >
                  {person.profile.full_name ||
                    "Name not provided"}
                </Link>
              </td>

              <td className="px-4 py-3">
                {person.profile.phone ?? "—"}
              </td>

              <td className="px-4 py-3">
                {formatDate(person.created_at)}
              </td>

              <td className="px-4 py-3">
                <Badge
                  variant={
                    person.status === "active"
                      ? "success"
                      : "neutral"
                  }
                >
                  {person.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}