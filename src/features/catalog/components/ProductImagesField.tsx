import { useState } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

import { ImageUploader } from "@/components/shared/ImageUploader";
import { PrivateImage } from "@/components/shared/PrivateImage";

import { useAuth } from "@/hooks/useAuth";

import { uploadProductImage } from "@/lib/supabase/storage.api";

import {
  getProductImages,
  saveProductImages,
  type GalleryImage,
} from "../catalog-media.api";

interface ProductImagesFieldProps {
  productId: string;
  storeId: string;
}

export function ProductImagesField({
  productId,
  storeId,
}: ProductImagesFieldProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);

  const queryKey = [
    "user",
    user?.id,
    "product-images",
    productId,
  ] as const;

  const gallery = useQuery({
    queryKey,

    queryFn: ({ signal }) =>
      getProductImages(productId, signal),

    enabled: Boolean(user),
  });

  const mutation = useMutation({
    mutationFn: async (images: GalleryImage[]) => {
      if (!gallery.data) {
        throw new Error("Load the gallery first.");
      }

      await saveProductImages(
        productId,
        gallery.data,
        images,
      );
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey,
      });

      await queryClient.invalidateQueries({
        queryKey: ["user", user?.id, "business"],
      });
    },

    onError: async () => {
      await queryClient.invalidateQueries({
        queryKey,
      });
    },
  });

  const locked =
    uploading ||
    mutation.isPending ||
    gallery.isFetching;

  async function handleUpload(file: File) {
    if (!gallery.data || locked) {
      throw new Error("Gallery is not ready.");
    }

    setUploading(true);

    try {
      const path = await uploadProductImage(
        storeId,
        productId,
        file,
      );

      await mutation.mutateAsync([
        ...gallery.data,
        {
          id: crypto.randomUUID(),
          imagePath: path,
          altText: "",
        },
      ]);
    } finally {
      setUploading(false);
    }
  }

  function move(index: number, direction: number) {
    const images = [...(gallery.data ?? [])];
    const next = index + direction;

    if (next < 0 || next >= images.length) {
      return;
    }

    [images[index], images[next]] = [
      images[next],
      images[index],
    ];

    mutation.mutate(images);
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-lg font-semibold">
        Product images
      </h2>

      <p className="text-xs leading-5 text-muted">
        Changes save separately from product details.
        The first image is the main gallery image.
      </p>

      {gallery.isPending ? (
        <Spinner label="Loading product images" />
      ) : gallery.isError ? (
        <div>
          <p role="alert" className="text-sm text-danger">
            Images could not load.
          </p>

          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => {
              void gallery.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {gallery.data.map((image, index) => (
              <article
                key={image.id}
                className="space-y-3 rounded-lg border border-border p-3"
              >
                <PrivateImage
                  path={image.imagePath}
                  alt={
                    image.altText ||
                    `Product photo ${index + 1}`
                  }
                  className="aspect-square"
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={locked || index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Move photo ${index + 1} earlier`}
                  >
                    Earlier
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      locked ||
                      index === gallery.data.length - 1
                    }
                    onClick={() => move(index, 1)}
                    aria-label={`Move photo ${index + 1} later`}
                  >
                    Later
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    disabled={locked}
                    onClick={() => {
                      mutation.mutate(
                        gallery.data.filter(
                          (item) => item.id !== image.id,
                        ),
                      );
                    }}
                    aria-label={`Remove photo ${index + 1} from gallery`}
                  >
                    Remove
                  </Button>
                </div>
              </article>
            ))}
          </div>

          {gallery.data.length === 0 && (
            <p className="text-sm text-muted">
              No product images uploaded yet.
            </p>
          )}

          <ImageUploader
            disabled={locked}
            onUpload={handleUpload}
          />
        </>
      )}

      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          Gallery update failed. The latest images
          have been requested. Check before retrying.
        </p>
      )}

      {mutation.isSuccess && (
        <p role="status" className="text-sm text-success">
          Gallery updated.
        </p>
      )}
    </section>
  );
}