import type { ReactNode } from "react";
export function FilterBar({children}:{children:ReactNode}){return <section aria-label="Filters" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">{children}</section>;}
