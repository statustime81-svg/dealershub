import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { routes } from "@/config/routes";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-12">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center">
        <ShieldAlert
          size={32}
          aria-hidden="true"
          className="mx-auto text-warning"
        />

        <p className="mt-5 font-mono text-xs text-muted">
          403
        </p>

        <h1 className="mt-2 text-2xl font-bold">
          Access restricted
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted">
          Your account does not have permission to
          access this area. Contact your business
          administrator if you need access.
        </p>

        <Link
          to={routes.public.home}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-lime px-5 text-sm font-semibold text-midnight hover:bg-lime-hover"
        >
          Go to home
        </Link>
      </section>
    </main>
  );
}