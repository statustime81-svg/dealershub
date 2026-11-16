import { Link,Navigate } from "react-router-dom";
import { useBusiness } from "@/hooks/useBusiness";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
export default function WorkspaceEntry(){
 const{activeMembership,isDealer,isPlatformAdmin,isLoading,error,refreshAccess}=useBusiness();
 if(isLoading)return <Spinner label="Loading your workspace"/>;
 if(error)return <section><h2 className="text-lg font-semibold">Account access could not load</h2><Button className="mt-4" onClick={()=>{void refreshAccess().catch(()=>{});}}>Try again</Button></section>;
 if(isPlatformAdmin)return <Navigate to={routes.admin.dashboard} replace/>;
 if(activeMembership?.role==="business_admin")return <Navigate to={routes.manufacturer.dashboard} replace/>;
 if(activeMembership?.role==="salesperson")return <Navigate to={`${routes.salesperson.dealers}?businessId=${activeMembership.business_id}`} replace/>;
 if(isDealer)return <Navigate to={routes.dealer.stores} replace/>;
 return <section><h2 className="text-xl font-semibold">Contact your administrator</h2><p className="mt-2 text-sm leading-6 text-muted">No active workspace is assigned to this account. Ask your administrator to check business or store access.</p><Link to={routes.auth.login} className="mt-4 inline-block text-sm font-medium text-info">Sign in with another account</Link></section>;
}
