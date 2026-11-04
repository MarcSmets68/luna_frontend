"use client";

import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import type { CorrectieReden, MockLijn } from "../types";
import { alleOnderdelenVerwerkt, isVerwerkt } from "../reducer";
import { AantalPaneel } from "./aantal-paneel";
import { OnderdelenTabel } from "./onderdelen-tabel";
import { TekortDialog } from "./tekort-dialog";
import { TellenDialog } from "./tellen-dialog";

export function LijnScanScreen({
  lijn,
  activeOnderdeelId,
  aantal,
  pogingen,
  foutmelding,
  leidinggevendeVerwittigd,
  tekortDialogOpen,
  tellenDialogOpen,
  onScanJuist,
  onScanFout,
  onAckLeidinggevende,
  onAantalChange,
  onBevestigAantal,
  onOngedaanMaken,
  onFysiekAanwezig,
  onSluitTekortDialog,
  onBevestigTelling,
  onNaarProductielijst,
  onTerug,
}: {
  lijn: MockLijn;
  activeOnderdeelId: string | null;
  aantal: number | null;
  pogingen: number;
  foutmelding: string | null;
  leidinggevendeVerwittigd: boolean;
  tekortDialogOpen: boolean;
  tellenDialogOpen: boolean;
  onScanJuist: (onderdeelId: string) => void;
  onScanFout: (omschrijving: string) => void;
  onAckLeidinggevende: () => void;
  onAantalChange: (aantal: number) => void;
  onBevestigAantal: () => void;
  onOngedaanMaken: (onderdeelId: string) => void;
  onFysiekAanwezig: (aanwezig: boolean) => void;
  onSluitTekortDialog: () => void;
  onBevestigTelling: (
    geteld: number,
    reden: CorrectieReden,
    toelichting?: string,
  ) => void;
  onNaarProductielijst: () => void;
  onTerug: () => void;
}) {
  const [scanInput, setScanInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const actief = lijn.onderdelen.find((o) => o.id === activeOnderdeelId) ?? null;
  const verwerkt = lijn.onderdelen.filter((o) => isVerwerkt(o.status)).length;
  const totaal = lijn.onderdelen.length;
  const klaarOmTeVersturen = alleOnderdelenVerwerkt(lijn);
  const toontAantalPaneel = actief && aantal !== null;
  const wachtOpScan = actief && aantal === null;

  function handleScan() {
    if (!actief) return;
    const waarde = scanInput.trim();
    setScanInput("");
    if (!waarde) return;
    if (waarde.toLowerCase() === actief.artikelcode.toLowerCase()) {
      onScanJuist(actief.id);
    } else {
      onScanFout(`gescand '${waarde}'`);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6 sm:p-8">
      <div>
        <button
          type="button"
          onClick={onTerug}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Terug naar reservatielijst
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Bon {lijn.bonnr} &middot; {lijn.armatuur}
          </h1>
          <p className="text-sm text-muted-foreground">
            Aantal: {lijn.aantal} &middot; {verwerkt}/{totaal} onderdelen verwerkt
          </p>
        </div>
        {klaarOmTeVersturen && (
          <Button type="button" className="min-h-11" onClick={onNaarProductielijst}>
            Naar productielijst
          </Button>
        )}
      </div>

      <Progress value={totaal === 0 ? 0 : (verwerkt / totaal) * 100}>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>

      <OnderdelenTabel
        onderdelen={lijn.onderdelen}
        activeOnderdeelId={activeOnderdeelId}
      />

      {lijn.onderdelen
        .filter((o) => o.status === "gereserveerd")
        .map((o) => (
          <div
            key={`undo-${o.id}`}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span>
              {o.artikelcode}: {o.genomenAantal} bevestigd
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => onOngedaanMaken(o.id)}
            >
              Bevestiging ongedaan maken
            </Button>
          </div>
        ))}

      {actief && wachtOpScan && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Scan het volgende onderdeel: <strong>{actief.artikelcode}</strong>{" "}
            ({actief.omschrijving})
          </p>
          <Input
            ref={inputRef}
            autoFocus
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleScan();
            }}
            placeholder="Scan hier (Enter = bevestig)"
            aria-label="Scanveld"
          />

          {foutmelding && (
            <p role="alert" className="text-sm text-destructive">
              {foutmelding}
            </p>
          )}

          {leidinggevendeVerwittigd && (
            <Button type="button" variant="outline" className="min-h-11 w-fit" onClick={onAckLeidinggevende}>
              Verder gaan
            </Button>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="min-h-11"
              onClick={() => onScanJuist(actief.id)}
            >
              Simuleer scan: juist onderdeel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => onScanFout("ander vermogen")}
            >
              Simuleer scan: fout onderdeel (ander vermogen)
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => onScanFout("onleesbaar etiket")}
            >
              Simuleer scan: onleesbaar etiket
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Poging {pogingen} van 3</p>
        </div>
      )}

      {actief && toontAantalPaneel && (
        <AantalPaneel
          onderdeel={actief}
          aantal={aantal ?? 0}
          onAantalChange={onAantalChange}
          onBevestig={onBevestigAantal}
        />
      )}

      <TekortDialog
        open={tekortDialogOpen}
        onderdeel={actief}
        onAanwezig={onFysiekAanwezig}
      />
      <TellenDialog
        open={tellenDialogOpen}
        onderdeel={actief}
        onBevestig={onBevestigTelling}
        onAnnuleer={onSluitTekortDialog}
      />
    </div>
  );
}
