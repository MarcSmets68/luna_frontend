"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CORRECTIE_REDENEN, type CorrectieReden, type MockOnderdeel } from "../types";

export function TellenDialog({
  open,
  onderdeel,
  onBevestig,
  onAnnuleer,
}: {
  open: boolean;
  onderdeel: MockOnderdeel | null;
  onBevestig: (geteld: number, reden: CorrectieReden, toelichting?: string) => void;
  onAnnuleer: () => void;
}) {
  const [geteld, setGeteld] = useState<string>("");
  const [reden, setReden] = useState<CorrectieReden | "">("");
  const [toelichting, setToelichting] = useState("");

  if (!onderdeel) return null;

  const getelAantal = Number(geteld);
  const grootAfwijking =
    geteld !== "" &&
    (Math.abs(getelAantal - onderdeel.stock) > 10 ||
      Math.abs(getelAantal - onderdeel.stock) / Math.max(onderdeel.stock, 1) >
        0.2);
  const kanOpslaan =
    geteld !== "" && !Number.isNaN(getelAantal) && getelAantal >= 0 && reden !== "";

  function reset() {
    setGeteld("");
    setReden("");
    setToelichting("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onAnnuleer();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tel en corrigeer</DialogTitle>
          <DialogDescription>
            {onderdeel.artikelcode} &middot; {onderdeel.omschrijving}
            <br />
            Systeemstock: {onderdeel.stock}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Werkelijk geteld aantal
            <Input
              type="number"
              min={0}
              value={geteld}
              onChange={(e) => setGeteld(e.target.value)}
              aria-label="Werkelijk geteld aantal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Reden
            <Select
              value={reden || undefined}
              onValueChange={(v) => setReden(v as CorrectieReden)}
            >
              <SelectTrigger className="w-full" aria-label="Reden">
                <SelectValue placeholder="Kies een reden" />
              </SelectTrigger>
              <SelectContent>
                {CORRECTIE_REDENEN.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {reden === "andere" && (
            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
              Toelichting
              <Textarea
                value={toelichting}
                onChange={(e) => setToelichting(e.target.value)}
                aria-label="Toelichting"
              />
            </label>
          )}

          {geteld !== "" && (
            <p className="text-sm text-muted-foreground">
              Log-preview: {onderdeel.artikelcode} door Operator (mockup),
              verschil {getelAantal - onderdeel.stock >= 0 ? "+" : ""}
              {getelAantal - onderdeel.stock}
            </p>
          )}

          {grootAfwijking && (
            <p role="alert" className="text-sm text-destructive">
              Grote afwijking - tweede goedkeuring nodig, technisch
              verantwoordelijke wordt verwittigd.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAnnuleer}>
            Annuleer
          </Button>
          <Button
            type="button"
            disabled={!kanOpslaan}
            onClick={() => {
              onBevestig(getelAantal, reden as CorrectieReden, toelichting || undefined);
              reset();
            }}
          >
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
