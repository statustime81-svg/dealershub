import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { StoreWorkspace } from "./MyStorePage";
import { StoreSettingsForm } from "../components/StoreSettingsForm";
import { saveBusinessLogo, saveStoreSettings } from "../stores.api";
import type { StoreWorkspaceData, StoreSettingsValues } from "../stores.schemas";

function SettingsEditor({ store }: { store: StoreWorkspaceData }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const businessKey = ["user", user?.id, "business", store.business_id];
  async function save(values: StoreSettingsValues) {
    setMessage(null); setError(null);
    try {
      await saveStoreSettings({ businessId: store.business_id, storeId: store.id,
        expectedUpdatedAt: store.updated_at, values });
      await cache.invalidateQueries({ queryKey: businessKey });
      setMessage("Store settings saved.");
    } catch {
      setError("Settings could not be saved. The URL name may be taken, or the store changed. Reload before retrying.");
    }
  }
  return (
    <div className="space-y-4">
      {message && <p role="status" className="text-sm text-success">{message}</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <StoreSettingsForm store={store} onSave={save} onLogoSave={async (path) => {
        await saveBusinessLogo(store.business_id, path);
        await cache.invalidateQueries({ queryKey: businessKey });
      }} />
    </div>
  );
}
export default function StoreSettingsPage() {
  return <StoreWorkspace title="Store settings">{(store) => <SettingsEditor key={store.id} store={store} />}</StoreWorkspace>;
}
