import { PageHeader } from "@/components/shared/PageHeader";
import { ReportWorkspace } from "@/features/reports/components/ReportWorkspace";
export default function PlatformReportsPage(){return <div className="space-y-6"><PageHeader title="Platform reports" description="Order activity across all registered businesses."/><ReportWorkspace businessId={null} platform/></div>;}
