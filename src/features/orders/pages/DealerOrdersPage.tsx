import { PageHeader } from "@/components/shared/PageHeader";
import { OrderListPanel } from "./ManufacturerOrdersPage";
export default function DealerOrdersPage() {
  return <div className="space-y-6"><PageHeader title="My orders" description="Review purchases from stores you are authorized to access." />
    <OrderListPanel mode="dealer" businessId={null} />
  </div>;
}
