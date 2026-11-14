import { useRef } from "react";

import { X } from "lucide-react";
import { Outlet } from "react-router-dom";

import { Button } from "@/components/ui/Button";

import { AppHeader } from "./components/AppHeader";
import { AppSidebar } from "./components/AppSidebar";

export default function ManufacturerLayout() {
  const dialogRef =
    useRef<HTMLDialogElement>(null);

  function openNavigation() {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }

  function closeNavigation() {
    dialogRef.current?.close();
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto bg-midnight [scrollbar-color:#334155_#0b1220] lg:block">
        <AppSidebar />
      </aside>

      <dialog
        ref={dialogRef}
        aria-label="Manufacturer navigation"
        className="fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-dvh w-72 max-w-[90vw] border-0 bg-midnight p-0 text-white backdrop:bg-black/40"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const rect =
              event.currentTarget.getBoundingClientRect();

            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            ) {
              closeNavigation();
            }
          }
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex justify-end px-3 pt-3">
            <Button
              variant="ghost"
              size="icon"
              autoFocus
              aria-label="Close navigation"
              onClick={closeNavigation}
              className="text-white hover:bg-midnight-raised"
            >
              <X
                size={20}
                aria-hidden="true"
              />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <AppSidebar
              onNavigate={closeNavigation}
            />
          </div>
        </div>
      </dialog>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 bg-surface">
          <AppHeader onOpenNavigation={openNavigation} />
        </div>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}