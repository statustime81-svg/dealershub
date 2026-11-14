import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { routes } from "@/config/routes";
import DealersPage from "./DealersPage";
export default function DealerAccessRequestsPage(){return <div className="space-y-4"><PageHeader title="Dealer access requests" description="Choose Pending in the dealer status filter to approve or reject requested store access."/><Link className="text-sm underline" to={routes.manufacturer.dealers}>Open dealer management</Link><DealersPage/></div>;}
