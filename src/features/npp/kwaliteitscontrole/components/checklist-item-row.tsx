"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { KwaliteitscontroleErrorState } from "./kwaliteitscontrole-error-state";
import type { QcChecklistItem, QcItemState } from "../types";

/**
 * One checklist row: label + 3 large touch buttons (OK / N.v.t. / Fout -
 * PRD §4.1 touch-UI, ≥44x44px, color-differentiated per
 * docs/design-system.md's semantic success/warning/destructive tokens).
 *
 * For a swInfo item, tapping OK does not answer immediately - it reveals
 * an inline text input that must be filled in and confirmed first (the
 * backend requires `info` for swInfo+OK). N.v.t./Fout and OK on a
 * non-swInfo item answer immediately, no confirmation step.
 */
export function ChecklistItemRow({
  item,
  saving,
  error,
  onAnswer,
}: {
  item: QcChecklistItem;
  saving: boolean;
  error: string | null;
  onAnswer: (controle: Exclude<QcItemState, "Te controleren">, info?: string) => void;
}) {
  const [showInfoInput, setShowInfoInput] = useState(false);
  const [infoValue, setInfoValue] = useState(item.info ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInfoInput) inputRef.current?.focus();
  }, [showInfoInput]);

  function handleOkClick() {
    if (item.swInfo) {
      setInfoValue(item.info ?? "");
      setShowInfoInput(true);
      return;
    }
    onAnswer("OK");
  }

  function submitInfo() {
    const trimmed = infoValue.trim();
    if (trimmed === "") return;
    onAnswer("OK", trimmed);
    setShowInfoInput(false);
  }

  function cancelInfo() {
    setShowInfoInput(false);
    setInfoValue(item.info ?? "");
  }

  const infoRequiredAndEmpty = infoValue.trim() === "";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-base font-medium text-foreground">{item.omschr}</span>
        {item.controle !== "Te controleren" && (
          <span className="text-sm text-muted-foreground">
            Huidig: {item.controle}
            {item.info && ` - ${item.info}`}
          </span>
        )}
      </div>

      <div role="group" aria-label={`Controle voor ${item.omschr}`} className="grid grid-cols-3 gap-3">
        <button
          type="button"
          aria-pressed={item.controle === "OK"}
          onClick={handleOkClick}
          disabled={saving}
          className={cn(
            "min-h-16 rounded-xl border border-transparent text-base font-semibold transition-colors disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            item.controle === "OK"
              ? "bg-success text-white"
              : "bg-success-bg text-success-fg hover:bg-success hover:text-white"
          )}
        >
          {saving ? <Loader2 className="mx-auto size-5 animate-spin" /> : "OK"}
        </button>

        <button
          type="button"
          aria-pressed={item.controle === "N.v.t."}
          onClick={() => onAnswer("N.v.t.")}
          disabled={saving}
          className={cn(
            "min-h-16 rounded-xl border border-transparent text-base font-semibold transition-colors disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            item.controle === "N.v.t."
              ? "bg-secondary text-secondary-foreground"
              : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
          )}
        >
          {saving ? <Loader2 className="mx-auto size-5 animate-spin" /> : "N.v.t."}
        </button>

        <button
          type="button"
          aria-pressed={item.controle === "Fout"}
          onClick={() => onAnswer("Fout")}
          disabled={saving}
          className={cn(
            "min-h-16 rounded-xl border border-transparent text-base font-semibold transition-colors disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            item.controle === "Fout"
              ? "bg-destructive text-white"
              : "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
          )}
        >
          {saving ? <Loader2 className="mx-auto size-5 animate-spin" /> : "Fout"}
        </button>
      </div>

      {showInfoInput && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Info (verplicht)
            <Input
              ref={inputRef}
              type="text"
              value={infoValue}
              onChange={(e) => setInfoValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitInfo();
                }
              }}
              aria-label={`Info voor ${item.omschr}`}
              className="h-12 rounded-xl text-base"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={cancelInfo} disabled={saving}>
              Annuleren
            </Button>
            <Button type="button" onClick={submitInfo} disabled={saving || infoRequiredAndEmpty}>
              Bevestigen
            </Button>
          </div>
        </div>
      )}

      {error && <KwaliteitscontroleErrorState message={error} />}
    </div>
  );
}
