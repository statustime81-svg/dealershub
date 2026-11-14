export type QueryFilters = Readonly<
  Record<string, string | number | boolean | null>
>;

export const queryKeys = {
  user: (userId: string) =>
    ["user", userId] as const,

  businesses: (userId: string) =>
    ["user", userId, "businesses"] as const,

  business: (
    userId: string,
    businessId: string,
  ) =>
    [
      "user",
      userId,
      "business",
      businessId,
    ] as const,

  dashboard: (
    userId: string,
    businessId: string,
    filters: QueryFilters = {},
  ) =>
    [
      ...queryKeys.business(userId, businessId),
      "dashboard",
      filters,
    ] as const,

  products: (
    userId: string,
    businessId: string,
    filters: QueryFilters = {},
  ) =>
    [
      ...queryKeys.business(userId, businessId),
      "products",
      filters,
    ] as const,

  dealers: (
    userId: string,
    businessId: string,
    filters: QueryFilters = {},
  ) =>
    [
      ...queryKeys.business(userId, businessId),
      "dealers",
      filters,
    ] as const,

  salesTeam: (
    userId: string,
    businessId: string,
  ) =>
    [
      ...queryKeys.business(userId, businessId),
      "sales-team",
    ] as const,

  businessOrders: (
    userId: string,
    businessId: string,
    filters: QueryFilters = {},
  ) =>
    [
      ...queryKeys.business(userId, businessId),
      "orders",
      filters,
    ] as const,

  authorizedStores: (userId: string) =>
    [
      "user",
      userId,
      "authorized-stores",
    ] as const,

  store: (
    userId: string,
    storeId: string,
  ) =>
    [
      "user",
      userId,
      "store",
      storeId,
    ] as const,

  storeProducts: (
    userId: string,
    storeId: string,
    filters: QueryFilters = {},
  ) =>
    [
      ...queryKeys.store(userId, storeId),
      "products",
      filters,
    ] as const,

  product: (
    userId: string,
    storeId: string,
    productId: string,
  ) =>
    [
      ...queryKeys.store(userId, storeId),
      "product",
      productId,
    ] as const,

  cart: (
    userId: string,
    storeId: string,
    dealerId: string,
  ) =>
    [
      ...queryKeys.store(userId, storeId),
      "cart",
      dealerId,
    ] as const,

  dealerOrders: (
    userId: string,
    dealerId: string,
    filters: QueryFilters = {},
  ) =>
    [
      "user",
      userId,
      "dealer",
      dealerId,
      "orders",
      filters,
    ] as const,

  assignedDealers: (
    userId: string,
    businessId: string,
  ) =>
    [
      ...queryKeys.business(userId, businessId),
      "assigned-dealers",
    ] as const,

  order: (
    userId: string,
    orderId: string,
  ) =>
    [
      "user",
      userId,
      "order",
      orderId,
    ] as const,

  platform: (userId: string) =>
    [
      "user",
      userId,
      "platform",
    ] as const,
};