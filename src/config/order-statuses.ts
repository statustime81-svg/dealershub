import type { OrderStatus } from "@/types/order";

import type { BadgeVariant } from "@/components/ui/Badge";

export interface OrderStatusDefinition {
  label: string;
  variant: BadgeVariant;
}

export const orderStatuses: Record<
  OrderStatus,
  OrderStatusDefinition
> = {
  pending: {
    label: "Pending",
    variant: "warning",
  },

  confirmed: {
    label: "Confirmed",
    variant: "lime",
  },

  rejected: {
    label: "Rejected",
    variant: "danger",
  },

  processing: {
    label: "Processing",
    variant: "info",
  },

  dispatched: {
    label: "Dispatched",
    variant: "neutral",
  },

  delivered: {
    label: "Delivered",
    variant: "success",
  },

  cancelled: {
    label: "Cancelled",
    variant: "danger",
  },
};

export const orderStatusOptions = (
  Object.keys(orderStatuses) as OrderStatus[]
).map((value) => ({
  value,
  label: orderStatuses[value].label,
}));