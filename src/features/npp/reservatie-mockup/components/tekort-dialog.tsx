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
}: {
  open: boolean;
  onderdeel: MockOnderdeel | null;
  onAanwezig: (aanwezig: boolean) => void;
}) {
  if (!onderdeel) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onAanwezig(false)}>
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
