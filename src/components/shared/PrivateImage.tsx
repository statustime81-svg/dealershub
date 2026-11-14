import { Package } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSignedImage } from "@/hooks/useSignedImage";

interface PrivateImageProps {
  path: string | null | undefined;
  alt: string;
  className?: string;
}

export function PrivateImage({
  path,
  alt,
  className,
}: PrivateImageProps) {
  const image = useSignedImage(path);

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-lg bg-soft",
        className,
      )}
    >
      {image.data ? (
        <img
          key={image.data}
          src={image.data}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-contain"
        />
      ) : (
        <Package
          size={22}
          aria-hidden="true"
          className="text-muted"
        />
      )}

      {image.isError && (
        <span className="sr-only">
          Image unavailable
        </span>
      )}
    </div>
  );
}