"use client";

import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Always visible/enabled during the checklist step - the operator can
 * reject the whole bon/groep at any point, regardless of individual item
 * states. Opens afkeur-dialog.tsx for the mandatory opmerking.
 */
export function AfkeurButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="destructive"
      onClick={onClick}
      className="h-14 w-full rounded-xl text-base font-semibold sm:w-auto"
    >
      <XCircle className="size-5" />
      Afkeuren
    </Button>
  );
}
