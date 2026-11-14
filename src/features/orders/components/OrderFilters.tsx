import { Select } from "@/components/ui/Select";
import { SearchInput } from "@/components/shared/SearchInput";
import { orderStatuses } from "@/config/order-statuses";
import { orderStatusSchema, type OrderListInput } from "../orders.schemas";
export type OrderFilterValues = Pick<OrderListInput, "status" | "search">;
export function OrderFilters({ value, onChange }: { value: OrderFilterValues; onChange: (value: OrderFilterValues) => void }) {
  return <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
    <SearchInput label="Search orders" placeholder="Search order number or dealer…" maxLength={200} value={value.search}
      onChange={(event) => onChange({ ...value, search: event.target.value })} />
    <Select aria-label="Order status" value={value.status} onChange={(event) => {
      const parsed = orderStatusSchema.safeParse(event.target.value);
      if (event.target.value === "all") onChange({ ...value, status: "all" });
      else if (parsed.success) onChange({ ...value, status: parsed.data });
    }}><option value="all">All statuses</option>
      {orderStatusSchema.options.map((status) => <option key={status} value={status}>{orderStatuses[status].label}</option>)}
    </Select>
  </div>;
}
