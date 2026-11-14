import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { orderStatuses } from "@/config/order-statuses";
import { useOrderStatusMutation } from "../orders.hooks";
import type { OrderWorkspace } from "../orders.schemas";
export function OrderStatusControls({ workspace }: { workspace: OrderWorkspace }) {
  const [selected, setSelected] = useState<string>(workspace.allowedStatuses[0] ?? "");
  const [note, setNote] = useState("");
  const request = useRef<{ signature: string; key: string } | null>(null);
  const mutation = useOrderStatusMutation(workspace.order.id);
  if (!workspace.canManage) return null;
  if (!workspace.allowedStatuses.length) return <p className="text-sm text-muted">No further status transitions are available.</p>;
  return <form className="space-y-4 rounded-xl border border-border bg-surface p-5" onSubmit={(event) => {
    event.preventDefault();
    const nextStatus = workspace.allowedStatuses.find((status) => status === selected);
    if (!nextStatus || !workspace.statusUpdatesReady || mutation.isPending) return;
    if (nextStatus === "rejected" && !window.confirm("Reject this order? Rejection cannot be reversed through the current workflow.")) return;
    const values = { orderId: workspace.order.id, expectedStatus: workspace.order.status,
      expectedUpdatedAt: workspace.order.updatedAt, newStatus: nextStatus, note: note.trim() };
    const signature = JSON.stringify(values);
    if (request.current?.signature !== signature) request.current = { signature, key: crypto.randomUUID() };
    mutation.mutate({ ...values, requestKey: request.current.key });
  }}>
    <h2 className="text-lg font-semibold">Update order status</h2>
    {!workspace.statusUpdatesReady && <p className="text-xs leading-5 text-muted">Status changes are awaiting confirmation of the business's inventory handling rules.</p>}
    <Select label="Next status" value={selected} disabled={!workspace.statusUpdatesReady || mutation.isPending}
      onChange={(event) => { setSelected(event.target.value); mutation.reset(); }}>
      {workspace.allowedStatuses.map((status) => <option key={status} value={status}>{orderStatuses[status].label}</option>)}
    </Select>
    <Textarea label="Status note" hint="This note is visible in the order history, including to the dealer."
      maxLength={2000} value={note} disabled={!workspace.statusUpdatesReady || mutation.isPending}
      onChange={(event) => { setNote(event.target.value); mutation.reset(); }} />
    {mutation.isError && <p role="alert" className="text-sm text-danger">Status could not be changed. Check the refreshed order and stock-policy configuration.</p>}
    {mutation.isSuccess && <p role="status" className="text-sm text-success">Order status updated.</p>}
    <Button type="submit" disabled={!workspace.statusUpdatesReady || !selected} isLoading={mutation.isPending} loadingText="Updating…">Update status</Button>
  </form>;
}
