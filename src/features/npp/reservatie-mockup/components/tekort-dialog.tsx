"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { MockOnderdeel } from "../types";

export function TekortDialog({
  open,
  onderdeel,
  onAanwezig,
  onAnnuleer,
}: {
  open: boolean;
  onderdeel: MockOnderdeel | null;
  onAanwezig: (aanwezig: boolean) => void;
  onAnnuleer: () => void;
}) {
  if (!onderdeel) return null;
  return (
    // Escape / outside click / the X button closes without answering - that
    // is NOT the same as "Nee, niet aanwezig" (which has real side effects:
    // wacht_op_materiaal or open + a log entry). Route it to onAnnuleer so
    // the operator just returns to "neem benodigd aantal" unchanged.
    <Dialog open={open} onOpenChange={(o) => !o && onAnnuleer()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Onvoldoende stock</DialogTitle>
          <DialogDescription>
            Voor <strong>{onderdeel.artikelcode}</strong> (
            {onderdeel.omschrijving}) staat er {onderdeel.stock} op stock,
            maar er is {onderdeel.benodigd} nodig. Is het onderdeel fysiek
            aanwezig?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => onAanwezig(false)}
          >
            Nee, niet aanwezig
          </Button>
          <Button
            type="button"
            className="min-h-11"
            onClick={() => onAanwezig(true)}
          >
            Ja, fysiek aanwezig
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
