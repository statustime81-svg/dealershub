import { FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";

import { routes } from "@/config/routes";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-12">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center">
        <FileQuestion
          size={32}
          aria-hidden="true"
          className="mx-auto text-muted"
        />

        <p className="mt-5 font-mono text-xs text-muted">
          404
        </p>

        <h1 className="mt-2 text-2xl font-bold">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted">
          This page does not exist, or the link is
          no longer available.
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