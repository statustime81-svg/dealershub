import StoreCategoriesPage from "@/features/storefront/pages/StoreCategoriesPage";
import PublicLayout from "@/layouts/PublicLayout";
import LandingPage from "@/pages/LandingPage";
import PlatformCategoriesPage from "@/features/super-admin/pages/PlatformCategoriesPage";
import PlatformBrandsPage from "@/features/super-admin/pages/PlatformBrandsPage";
import SubscriptionPlansPage from "@/features/super-admin/pages/SubscriptionPlansPage";
import BusinessSubscriptionsPage from "@/features/super-admin/pages/BusinessSubscriptionsPage";
import PlatformReportsPage from "@/features/super-admin/pages/PlatformReportsPage";
import InventoryPage from "@/features/inventory/pages/InventoryPage";
import BusinessReportsPage from "@/features/reports/pages/BusinessReportsPage";
import BusinessProfilePage from "@/features/businesses/pages/BusinessProfilePage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import DealerAccessRequestsPage from "@/features/dealers/pages/DealerAccessRequestsPage";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { routes } from "@/config/routes";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import PlatformDashboardPage from "@/features/super-admin/pages/PlatformDashboardPage";
import BusinessesPage from "@/features/super-admin/pages/BusinessesPage";
import BusinessDetailsPage from "@/features/super-admin/pages/BusinessDetailsPage";
import UsersPage from "@/features/super-admin/pages/UsersPage";
import AuthLayout from "@/layouts/AuthLayout";
import ManufacturerLayout from "@/layouts/ManufacturerLayout";
import SalespersonLayout from "@/layouts/SalespersonLayout";
import { AssignedDealerGuard } from "@/guards/AssignedDealerGuard";
import AssignedDealersPage from "@/features/salesperson/pages/AssignedDealersPage";
import DealerWorkspacePage from "@/features/salesperson/pages/DealerWorkspacePage";
import SalespersonOrdersPage, { SalespersonOrderDetailsPage } from "@/features/salesperson/pages/SalespersonOrdersPage";
import DealerLayout from "@/layouts/DealerLayout";
import StorefrontLayout from "@/layouts/StorefrontLayout";
import { AuthGuard } from "@/guards/AuthGuard";
import { BusinessGuard } from "@/guards/BusinessGuard";
import { RoleGuard } from "@/guards/RoleGuard";
import { StoreAccessGuard } from "@/guards/StoreAccessGuard";
import WorkspaceEntry from "@/pages/WorkspaceEntry";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterBusinessPage from "@/features/auth/pages/RegisterBusinessPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import AcceptInvitationPage from "@/features/auth/pages/AcceptInvitationPage";
import BusinessInvitationsPage from "@/features/auth/pages/BusinessInvitationsPage";
import ManufacturerDashboardPage from "@/features/dashboard/pages/ManufacturerDashboardPage";
import ProductsPage from "@/features/catalog/pages/ProductsPage";
import AddProductPage from "@/features/catalog/pages/AddProductPage";
import EditProductPage from "@/features/catalog/pages/EditProductPage";
import CategoriesPage from "@/features/catalog/pages/CategoriesPage";
import BrandsPage from "@/features/catalog/pages/BrandsPage";
import MyStorePage from "@/features/stores/pages/MyStorePage";
import StoreSettingsPage from "@/features/stores/pages/StoreSettingsPage";
import StoreBannersPage from "@/features/stores/pages/StoreBannersPage";
import DealersPage from "@/features/dealers/pages/DealersPage";
import DealerDetailsPage from "@/features/dealers/pages/DealerDetailsPage";
import SalesTeamPage from "@/features/sales-team/pages/SalesTeamPage";
import DealerAssignmentsPage from "@/features/sales-team/pages/DealerAssignmentsPage";
import SalespersonDetailsPage from "@/features/sales-team/pages/SalespersonDetailsPage";
import AuthorizedStoresPage from "@/features/storefront/pages/AuthorizedStoresPage";
import StoreHomePage from "@/features/storefront/pages/StoreHomePage";
import ProductListingPage from "@/features/storefront/pages/ProductListingPage";
import ProductDetailsPage from "@/features/storefront/pages/ProductDetailsPage";
import CartPage from "@/features/cart/pages/CartPage";
import CheckoutPage from "@/features/checkout/pages/CheckoutPage";
import OrderConfirmationPage from "@/features/checkout/pages/OrderConfirmationPage";
import ManufacturerOrdersPage from "@/features/orders/pages/ManufacturerOrdersPage";
import DealerOrdersPage from "@/features/orders/pages/DealerOrdersPage";
import OrderDetailsPage from "@/features/orders/pages/OrderDetailsPage";
import OrderTrackingPage from "@/features/orders/pages/OrderTrackingPage";
import ForbiddenPage from "@/pages/ForbiddenPage";
import NotFoundPage from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {element:<PublicLayout/>,children:[{path:routes.public.home,element:<LandingPage/>}]},
  {
    element: <AuthLayout />,
    children: [
      
      { path: routes.auth.login, element: <LoginPage /> },
      { path: routes.auth.register, element: <RegisterBusinessPage /> },
      { path: routes.auth.forgotPassword, element: <ForgotPasswordPage /> },
      { path: routes.auth.resetPassword, element: <ResetPasswordPage /> },
      { path: routes.auth.acceptInvitation, element: <AcceptInvitationPage /> },
      { element: <AuthGuard />, children: [{ path: routes.onboarding, element: <WorkspaceEntry /> }] },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard allowedRoles={["super_admin"]} />,
        children: [{
          path: routes.admin.root, element: <SuperAdminLayout />,
          children: [
            { index: true, element: <Navigate to={routes.admin.dashboard} replace /> },
            { path: "dashboard", element: <PlatformDashboardPage /> },
            { path: "businesses", element: <BusinessesPage /> },
            { path: "businesses/:businessId", element: <BusinessDetailsPage /> },
            { path: "users", element: <UsersPage /> },
            { path: "categories", element: <PlatformCategoriesPage /> },
            { path: "brands", element: <PlatformBrandsPage /> },
            { path: "plans", element: <SubscriptionPlansPage /> },
            { path: "subscriptions", element: <BusinessSubscriptionsPage /> },
            { path: "reports", element: <PlatformReportsPage /> },
          ],
        }],
      },
      {
        path: routes.salesperson.root,
        element: <AssignedDealerGuard requireDealer={false} />,
        children: [{
          element: <SalespersonLayout />,
          children: [
            { index: true, element: <AssignedDealersPage /> },
            { path: "dealers", element: <AssignedDealersPage /> },
            { path: "dealers/:dealerId", element: <AssignedDealerGuard />, children: [
              { index: true, element: <DealerWorkspacePage /> },
            ] },
            { path: "orders", element: <SalespersonOrdersPage /> },
            { path: "orders/:orderId", element: <SalespersonOrderDetailsPage /> },
          ],
        }],
      },
      {
        element: <BusinessGuard />,
        children: [{
          element: <RoleGuard allowedRoles={["business_admin"]} />,
          children: [{
            path: routes.manufacturer.root, element: <ManufacturerLayout />,
            children: [
              { index: true, element: <Navigate to={routes.manufacturer.dashboard} replace /> },
              { path: "dashboard", element: <ManufacturerDashboardPage /> },
              { path: "business", element: <BusinessProfilePage /> },
              { path: "inventory", element: <InventoryPage /> },
              { path: "reports", element: <BusinessReportsPage /> },
              { path: "dealer-access-requests", element: <DealerAccessRequestsPage /> },
              { path: "products", element: <ProductsPage /> },
              { path: "products/new", element: <AddProductPage /> },
              { path: "products/:productId/edit", element: <EditProductPage /> },
              { path: "store", element: <MyStorePage /> },
              { path: "store/settings", element: <StoreSettingsPage /> },
              { path: "store/banners", element: <StoreBannersPage /> },
              { path: "categories", element: <CategoriesPage /> },
              { path: "brands", element: <BrandsPage /> },
              { path: "dealers", element: <DealersPage /> },
              { path: "dealers/:dealerId", element: <DealerDetailsPage /> },
              { path: "sales-team", element: <SalesTeamPage /> },
              { path: "sales-team/:salespersonId", element: <SalespersonDetailsPage /> },
              { path: "assignments", element: <DealerAssignmentsPage /> },
              { path: "invitations", element: <BusinessInvitationsPage /> },
              { path: "orders", element: <ManufacturerOrdersPage /> },
              { path: "orders/:orderId", element: <OrderDetailsPage mode="manufacturer" /> },
            ],
          }],
        }],
      },
      {
        element: <RoleGuard allowedRoles={["dealer"]} />,
        children: [{
          element: <DealerLayout />,
          children: [
            { path: routes.dealer.root, element: <Navigate to={routes.dealer.stores} replace /> },
            { path: routes.dealer.stores, element: <AuthorizedStoresPage /> },
            { path: routes.dealer.orders, element: <DealerOrdersPage /> },
            { path: routes.dealer.profile, element: <ProfilePage /> },
            { path: "/dealer/orders/:orderId", element: <OrderDetailsPage mode="dealer" /> },
            { path: "/dealer/orders/:orderId/tracking", element: <OrderTrackingPage /> },
            { path: "/dealer/orders/:orderId/confirmation", element: <OrderConfirmationPage /> },
            {
              path: "/store/:storeId", element: <StoreAccessGuard />,
              children: [{
                element: <StorefrontLayout />,
                children: [
                  { index: true, element: <StoreHomePage /> },
                  { path: "products", element: <ProductListingPage /> },
                  { path: "categories", element: <StoreCategoriesPage /> },
                  { path: "categories/:categoryId", element: <ProductListingPage /> },
                  { path: "products/:productId", element: <ProductDetailsPage /> },
                  { path: "cart", element: <CartPage /> },
                  { path: "checkout", element: <CheckoutPage /> },
                ],
              }],
            },
          ],
        }],
      },
    ],
  },
  { path: routes.forbidden, element: <ForbiddenPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
