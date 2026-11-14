import { PageHeader } from "@/components/shared/PageHeader";
import { useBusiness } from "@/hooks/useBusiness";
import { ReportWorkspace } from "../components/ReportWorkspace";
export default function BusinessReportsPage(){const{activeBusinessId}=useBusiness();return <div className="space-y-6"><PageHeader title="Business reports" description="Order activity for the selected business."/>{activeBusinessId&&<ReportWorkspace key={activeBusinessId} businessId={activeBusinessId}/>}</div>;}
