import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useQueryClient } from "@tanstack/react-query";

import type {
  Session,
  User,
} from "@supabase/supabase-js";

import { env } from "@/config/env";

import { getSupabaseClient } from "@/lib/supabase/client";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
}

export const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

interface AuthProviderProps {
  children: ReactNode;
}

function errorMessage(value: unknown): string {
  return value instanceof Error
    ? value.message
    : "Unable to restore your session.";
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const queryClient = useQueryClient();

  const [session, setSession] =
    useState<Session | null>(null);

  const [isLoading, setIsLoading] = useState(
    env.isSupabaseConfigured,
  );

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!env.isSupabaseConfigured) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    let eventVersion = 0;
    let previousUserId: string | null = null;
    let unsubscribe: (() => void) | undefined;

    function applySession(
      nextSession: Session | null,
    ): void {
      if (!active) {
        return;
      }

      const nextUserId =
        nextSession?.user.id ?? null;

      if (previousUserId !== nextUserId) {
        queryClient.clear();
      }

      previousUserId = nextUserId;

      setSession(nextSession);
      setError(null);
      setIsLoading(false);
    }

    try {
      const supabase = getSupabaseClient();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        (event, nextSession) => {
          eventVersion += 1;

          if (
            active &&
            (
              event === "SIGNED_OUT" ||
              event === "USER_UPDATED"
            )
          ) {
            queryClient.clear();
          }

          applySession(nextSession);
        },
      );

      unsubscribe = () => {
        subscription.unsubscribe();
      };

      const restoreVersion = eventVersion;

      void supabase.auth
        .getSession()
        .then(({ data, error: sessionError }) => {
          if (
            !active ||
            eventVersion !== restoreVersion
          ) {
            return;
          }

          if (sessionError) {
            throw sessionError;
          }

          applySession(data.session);
        })
        .catch((cause: unknown) => {
          if (
            !active ||
            eventVersion !== restoreVersion
          ) {
            return;
          }

          queryClient.clear();

          setSession(null);
          setError(errorMessage(cause));
          setIsLoading(false);
        });
    } catch (cause: unknown) {
      if (active) {
        setSession(null);
        setError(errorMessage(cause));
        setIsLoading(false);
      }
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        isConfigured: env.isSupabaseConfigured,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}