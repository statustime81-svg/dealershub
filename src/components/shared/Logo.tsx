import { Link } from "react-router-dom";

import { routes } from "@/config/routes";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  to?: string;
}

export function Logo({
  className,
  to = routes.public.home,
}: LogoProps) {
  return (
    <Link
      to={to}
      aria-label="DealersHub home"
      className={cn(
        "inline-flex min-h-11 items-center",
        "text-xl font-bold tracking-tight",
        className,
      )}
    >
      Dealers<span className="text-lime">Hub</span>
    </Link>
  );
}