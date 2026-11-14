import { Navigate } from "react-router-dom";
import { useBusiness } from "@/hooks/useBusiness";
import { routes } from "@/config/routes";
import BusinessOnboardingPage from "@/features/businesses/pages/BusinessOnboardingPage";
export default function WorkspaceEntry() {
  const { activeMembership, isDealer, isPlatformAdmin, isLoading, error } = useBusiness();
  if (!isLoading && !error) {
    if (isPlatformAdmin) return <Navigate to={routes.admin.dashboard} replace />;
    if (activeMembership?.role === "business_admin") return <Navigate to={routes.manufacturer.dashboard} replace />;
    if (activeMembership?.role === "salesperson") return <Navigate to={`${routes.salesperson.dealers}?businessId=${activeMembership.business_id}`} replace />;
    if (isDealer) return <Navigate to={routes.dealer.stores} replace />;
  }
  return <BusinessOnboardingPage />;
}
