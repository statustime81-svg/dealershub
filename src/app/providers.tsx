import {
  useState,
  type ReactNode,
} from "react";

import { QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/contexts/AuthContext";
import { BusinessProvider } from "@/contexts/BusinessContext";

import { createAppQueryClient } from "./query-client";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({
  children,
}: AppProvidersProps) {
  const [queryClient] = useState(
    createAppQueryClient,
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BusinessProvider>
          {children}
        </BusinessProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}