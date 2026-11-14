import {
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/Button";

interface ImageUploaderProps {
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
}

export function ImageUploader({
  disabled = false,
  onUpload,
}: ImageUploaderProps) {
  const id = useId();

  const inputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);

    try {
      await onUpload(file);
    } catch {
      setError(
        "Image could not be saved. Use JPEG, PNG or WebP under 10 MB. Refresh the gallery before trying again.",
      );
    } finally {
      setBusy(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled || busy}
        className="sr-only"
        aria-label="Choose a product image"
        aria-describedby={`${id}-hint`}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void handleFile(file);
          }
        }}
      />

      <Button
        variant="secondary"
        disabled={disabled}
        isLoading={busy}
        loadingText="Uploading…"
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        Upload image
      </Button>

      <p
        id={`${id}-hint`}
        className="text-xs text-muted"
      >
        JPEG, PNG or WebP · Maximum 10 MB
      </p>

      {error && (
        <p
          role="alert"
          className="text-sm text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}