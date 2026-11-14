export const routes = {
  public: {
    home: "/",
  },

  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    acceptInvitation: "/accept-invitation",
  },

  onboarding: "/onboarding",

  manufacturer: {
    root: "/manufacturer",
    dashboard: "/manufacturer/dashboard",
    business: "/manufacturer/business",
    store: "/manufacturer/store",
    products: "/manufacturer/products",
    addProduct: "/manufacturer/products/new",
    categories: "/manufacturer/categories",
    brands: "/manufacturer/brands",
    inventory: "/manufacturer/inventory",
    dealers: "/manufacturer/dealers",
    accessRequests:
      "/manufacturer/dealer-access-requests",
    salesTeam: "/manufacturer/sales-team",
    assignments: "/manufacturer/assignments",
    invitations: "/manufacturer/invitations",
    orders: "/manufacturer/orders",
    reports: "/manufacturer/reports",
  },

  dealer: {
    root: "/dealer",
    stores: "/dealer/stores",
    orders: "/dealer/orders",
    profile: "/dealer/profile",
  },

  salesperson: {
    root: "/salesperson",
    dealers: "/salesperson/dealers",
    orders: "/salesperson/orders",
  },

  admin: {
    root: "/admin",
    dashboard: "/admin/dashboard",
    businesses: "/admin/businesses",
    users: "/admin/users",
    categories: "/admin/categories",
    brands: "/admin/brands",
    plans: "/admin/plans",
    subscriptions: "/admin/subscriptions",
    reports: "/admin/reports",
  },

  forbidden: "/forbidden",
} as const;

function segment(value: string): string {
  return encodeURIComponent(value);
}

export const routeBuilders = {
  editProduct: (productId: string) =>
    `/manufacturer/products/${segment(productId)}/edit`,

  manufacturerDealer: (dealerId: string) =>
    `/manufacturer/dealers/${segment(dealerId)}`,

  manufacturerSalesperson: (salespersonId: string) =>
    `/manufacturer/sales-team/${segment(salespersonId)}`,

  manufacturerOrder: (orderId: string) =>
    `/manufacturer/orders/${segment(orderId)}`,

  dealerOrder: (orderId: string) =>
    `/dealer/orders/${segment(orderId)}`,

  orderTracking: (orderId: string) =>
    `/dealer/orders/${segment(orderId)}/tracking`,

  orderConfirmation: (orderId: string) =>
    `/dealer/orders/${segment(orderId)}/confirmation`,

  store: (storeId: string) =>
    `/store/${segment(storeId)}`,

  storeProducts: (storeId: string) =>
    `/store/${segment(storeId)}/products`,

  storeCategories: (storeId: string) =>
    `/store/${segment(storeId)}/categories`,

  storeCategory: (
    storeId: string,
    categoryId: string,
  ) =>
    `/store/${segment(storeId)}/categories/${segment(categoryId)}`,

  storeProduct: (
    storeId: string,
    productId: string,
  ) =>
    `/store/${segment(storeId)}/products/${segment(productId)}`,

  cart: (storeId: string) =>
    `/store/${segment(storeId)}/cart`,

  checkout: (storeId: string) =>
    `/store/${segment(storeId)}/checkout`,

  salespersonDealer: (dealerId: string) =>
    `/salesperson/dealers/${segment(dealerId)}`,

  adminBusiness: (businessId: string) =>
    `/admin/businesses/${segment(businessId)}`,
};