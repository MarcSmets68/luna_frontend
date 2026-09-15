"use client";

import { Fragment, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  TITLE_LINE_TEXT_CLASS,
  classifyLineKind,
  flagsForLineKind,
  type LineKind,
} from "@/lib/line-classification";
import {
  createOfflijn,
  deleteOfflijn,
  reorderOfflijn,
  updateOfflijn,
  type OfflijnItem,
} from "@/lib/api-client";

export type LocalLijn = {
  clientId: string;
  artnr: string;
  omschrijving: string;
  omschrijvingOfferte: string;
  aantal: number;
  teLeveren: number;
  verkoopprijs: number;
  brutoVerkoopprijs: number;
  korting: number;
  btwKode: string;
  bedrag: number;
  bruto: number;
  aankoopprijs: number;
  opm: string;
  bestellen: boolean;
  blokkeren: boolean;
  subtotaal: boolean;
  kolomtitel: boolean;
  infolijn: boolean;
};

type LineFields = Omit<LocalLijn, "clientId">;

type OfferteLijnenEditorProps =
  | { mode: "local"; lijnen: LocalLijn[]; onChange: (lijnen: LocalLijn[]) => void }
  | {
      mode: "persisted";
      offnr: number;
      versie: number;
      lijnen: OfflijnItem[];
      onLijnenChange: (lijnen: OfflijnItem[]) => void;
    };

const NEW_LINE_TYPE_OPTIONS: { value: LineKind; label: string }[] = [
  { value: "artikel", label: "Artikellijn" },
  { value: "titel", label: "Titellijn" },
  { value: "subtotaal", label: "Subtotaal" },
  { value: "kolomtitel", label: "Kolomtitel" },
  { value: "infolijn", label: "Infolijn" },
];

const KIND_LABELS: Record<LineKind, string> = {
  artikel: "Artikel",
  titel: "Titel",
  subtotaal: "Subtotaal",
  kolomtitel: "Kolomtitel",
  infolijn: "Infolijn",
};

function emptyLineFields(): LineFields {
  return {
    artnr: "",
    omschrijving: "",
    omschrijvingOfferte: "",
    aantal: 0,
    teLeveren: 0,
    verkoopprijs: 0,
    brutoVerkoopprijs: 0,
    korting: 0,
    btwKode: "",
    bedrag: 0,
    bruto: 0,
    aankoopprijs: 0,
    opm: "",
    bestellen: false,
    blokkeren: false,
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
  };
}

function KindBadge({ kind }: { kind: LineKind }) {
  return (
    <span className="inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl bg-muted px-2 py-0.5 text-xs font-medium whitespace-nowrap text-muted-foreground">
      {KIND_LABELS[kind]}
    </span>
  );
}

export function OfferteLijnenEditor(props: OfferteLijnenEditorProps) {
  const { mode } = props;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [newLineKind, setNewLineKind] = useState<LineKind>("artikel");
  const [newLineFields, setNewLineFields] = useState<LineFields>(emptyLineFields());

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ---- local mode helpers ----
  function updateLocal(clientId: string, patch: Partial<LineFields>) {
    if (mode !== "local") return;
    props.onChange(
      props.lijnen.map((lijn) => (lijn.clientId === clientId ? { ...lijn, ...patch } : lijn))
    );
  }

  function deleteLocal(clientId: string) {
    if (mode !== "local") return;
    props.onChange(props.lijnen.filter((lijn) => lijn.clientId !== clientId));
  }

  function moveLocal(index: number, direction: "up" | "down") {
    if (mode !== "local") return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= props.lijnen.length) return;
    const next = [...props.lijnen];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    props.onChange(next);
  }

  function addLocal() {
    if (mode !== "local") return;
    const flags = flagsForLineKind(newLineKind);
    const newLijn: LocalLijn = {
      clientId:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `local-${Date.now()}-${Math.random()}`,
      ...emptyLineFields(),
      ...newLineFields,
      ...flags,
      artnr: flags.artnr ?? newLineFields.artnr,
    };
    props.onChange([...props.lijnen, newLijn]);
    setNewLineFields(emptyLineFields());
    setNewLineKind("artikel");
  }

  // ---- persisted mode helpers ----
  async function updatePersisted(lijnnr: number, patch: Partial<LineFields>) {
    if (mode !== "persisted") return;
    setBusyKey(`update-${lijnnr}`);
    setError(null);
    try {
      const updated = await updateOfflijn(props.offnr, props.versie, lijnnr, patch);
      props.onLijnenChange(props.lijnen.map((l) => (l.lijnnr === lijnnr ? updated : l)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van de lijn.");
    } finally {
      setBusyKey(null);
    }
  }

  async function deletePersisted(lijnnr: number) {
    if (mode !== "persisted") return;
    if (!window.confirm("Lijn verwijderen? Dit kan niet ongedaan worden gemaakt.")) return;
    setBusyKey(`delete-${lijnnr}`);
    setError(null);
    try {
      await deleteOfflijn(props.offnr, props.versie, lijnnr);
      props.onLijnenChange(props.lijnen.filter((l) => l.lijnnr !== lijnnr));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis bij het verwijderen van de lijn.");
    } finally {
      setBusyKey(null);
    }
  }

  async function movePersisted(lijnnr: number, direction: "up" | "down") {
    if (mode !== "persisted") return;
    setBusyKey(`move-${lijnnr}`);
    setError(null);
    try {
      const reordered = await reorderOfflijn(props.offnr, props.versie, lijnnr, direction);
      props.onLijnenChange(reordered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis bij het herordenen van de lijn.");
    } finally {
      setBusyKey(null);
    }
  }

  async function addPersisted() {
    if (mode !== "persisted") return;
    const flags = flagsForLineKind(newLineKind);
    const payload = {
      ...newLineFields,
      ...flags,
      artnr: flags.artnr ?? newLineFields.artnr,
    };
    setBusyKey("add");
    setError(null);
    try {
      const created = await createOfflijn(props.offnr, props.versie, payload);
      props.onLijnenChange([...props.lijnen, created]);
      setNewLineFields(emptyLineFields());
      setNewLineKind("artikel");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis bij het toevoegen van de lijn.");
    } finally {
      setBusyKey(null);
    }
  }

  type Row = {
    key: string;
    displayLijnnr: number;
    kind: LineKind;
    fields: LineFields;
    isFirst: boolean;
    isLast: boolean;
    onFieldChange: (patch: Partial<LineFields>) => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    busy: boolean;
  };

  const rows: Row[] =
    mode === "local"
      ? props.lijnen.map((lijn, index) => ({
          key: lijn.clientId,
          displayLijnnr: (index + 1) * 10,
          kind: classifyLineKind(lijn),
          fields: lijn,
          isFirst: index === 0,
          isLast: index === props.lijnen.length - 1,
          onFieldChange: (patch) => updateLocal(lijn.clientId, patch),
          onDelete: () => deleteLocal(lijn.clientId),
          onMoveUp: () => moveLocal(index, "up"),
          onMoveDown: () => moveLocal(index, "down"),
          busy: false,
        }))
      : props.lijnen.map((lijn, index) => ({
          key: String(lijn.lijnnr),
          displayLijnnr: lijn.lijnnr,
          kind: classifyLineKind(lijn),
          fields: lijn,
          isFirst: index === 0,
          isLast: index === props.lijnen.length - 1,
          onFieldChange: (patch) => updatePersisted(lijn.lijnnr, patch),
          onDelete: () => deletePersisted(lijn.lijnnr),
          onMoveUp: () => movePersisted(lijn.lijnnr, "up"),
          onMoveDown: () => movePersisted(lijn.lijnnr, "down"),
          busy:
            busyKey === `update-${lijn.lijnnr}` ||
            busyKey === `delete-${lijn.lijnnr}` ||
            busyKey === `move-${lijn.lijnnr}`,
        }));

  const isSpecialKind = (kind: LineKind) => kind !== "artikel";

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead>Lijnnr</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Artnr</TableHead>
            <TableHead>Omschrijving (offerte)</TableHead>
            <TableHead>Aantal</TableHead>
            <TableHead>Te leveren</TableHead>
            <TableHead>Vprijs</TableHead>
            <TableHead>Korting</TableHead>
            <TableHead>Bedrag</TableHead>
            <TableHead>Aankoopprijs</TableHead>
            <TableHead />
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} className="text-sm text-muted-foreground">
                Geen lijnen.
              </TableCell>
            </TableRow>
          ) : null}
          {rows.map((row) => {
            const isExpanded = expanded.has(row.key);
            if (isSpecialKind(row.kind)) {
              return (
                <TableRow key={row.key}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Omhoog"
                        disabled={row.isFirst || row.busy}
                        onClick={row.onMoveUp}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Omlaag"
                        disabled={row.isLast || row.busy}
                        onClick={row.onMoveDown}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{row.displayLijnnr}</TableCell>
                  <TableCell>
                    <KindBadge kind={row.kind} />
                  </TableCell>
                  <TableCell
                    colSpan={8}
                    className={cn("whitespace-normal", row.kind === "titel" && TITLE_LINE_TEXT_CLASS)}
                  >
                    <Input
                      value={row.fields.omschrijvingOfferte.trim() || row.fields.omschrijving}
                      onChange={(e) => row.onFieldChange({ omschrijvingOfferte: e.target.value })}
                      aria-label={`Omschrijving lijn ${row.displayLijnnr}`}
                      disabled={row.busy}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Verwijder lijn ${row.displayLijnnr}`}
                      disabled={row.busy}
                      onClick={row.onDelete}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            }

            return (
              <Fragment key={row.key}>
                <TableRow>
                  <TableCell>
                    <div className="flex flex-col">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Omhoog"
                        disabled={row.isFirst || row.busy}
                        onClick={row.onMoveUp}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Omlaag"
                        disabled={row.isLast || row.busy}
                        onClick={row.onMoveDown}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{row.displayLijnnr}</TableCell>
                  <TableCell>
                    <KindBadge kind={row.kind} />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.fields.artnr}
                      onChange={(e) => row.onFieldChange({ artnr: e.target.value })}
                      aria-label={`Artnr lijn ${row.displayLijnnr}`}
                      disabled={row.busy}
                      className="w-28"
                    />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <Input
                      value={row.fields.omschrijvingOfferte}
                      onChange={(e) => row.onFieldChange({ omschrijvingOfferte: e.target.value })}
                      aria-label={`Omschrijving lijn ${row.displayLijnnr}`}
                      disabled={row.busy}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.fields.aantal}
                      onChange={(e) => row.onFieldChange({ aantal: Number(e.target.value) })}
                      aria-label={`Aantal lijn ${row.displayLijnnr}`}
                      disabled={row.busy}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.fields.teLeveren}
                      onChange={(e) => row.onFieldChange({ teLeveren: Number(e.target.value) })}
                      aria-label={`Te leveren lijn ${row.displayLijnnr}`}
                      disabled={row.busy}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.fields.verkoopprijs}
                      onChange={(e) => row.onFieldChange({ verkoopprijs: Number(e.target.value) })}
                      aria-label={`Vprijs lijn ${row.displayLijnnr}`}
                      disabled={row.busy}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.fields.korting}
                      onChange={(e) => row.onFieldChange({ korting: Number(e.target.value) })}
                      aria-label={`Korting lijn ${row.displayLijnnr}`}
                      disabled={row.busy}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.fields.bedrag}
                      onChange={(e) => row.onFieldChange({ bedrag: Number(e.target.value) })}
                      aria-label={`Bedrag lijn ${row.displayLijnnr}`}
                      disabled={row.busy}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.fields.aankoopprijs}
                      onChange={(e) => row.onFieldChange({ aankoopprijs: Number(e.target.value) })}
                      aria-label={`Aankoopprijs lijn ${row.displayLijnnr}`}
                      disabled={row.busy}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(row.key)}
                    >
                      {isExpanded ? "Minder velden" : "Meer velden"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Verwijder lijn ${row.displayLijnnr}`}
                      disabled={row.busy}
                      onClick={row.onDelete}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
                {isExpanded ? (
                  <TableRow key={`${row.key}-extra`}>
                    <TableCell colSpan={13} className="whitespace-normal bg-muted/30">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                          BTW-kode
                          <Input
                            value={row.fields.btwKode}
                            onChange={(e) => row.onFieldChange({ btwKode: e.target.value })}
                            disabled={row.busy}
                            className="mt-1 font-normal normal-case"
                          />
                        </label>
                        <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                          Bruto verkoopprijs
                          <Input
                            type="number"
                            value={row.fields.brutoVerkoopprijs}
                            onChange={(e) =>
                              row.onFieldChange({ brutoVerkoopprijs: Number(e.target.value) })
                            }
                            disabled={row.busy}
                            className="mt-1 font-normal normal-case"
                          />
                        </label>
                        <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                          Bruto
                          <Input
                            type="number"
                            value={row.fields.bruto}
                            onChange={(e) => row.onFieldChange({ bruto: Number(e.target.value) })}
                            disabled={row.busy}
                            className="mt-1 font-normal normal-case"
                          />
                        </label>
                        <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                          Opmerking
                          <Input
                            value={row.fields.opm}
                            onChange={(e) => row.onFieldChange({ opm: e.target.value })}
                            disabled={row.busy}
                            className="mt-1 font-normal normal-case"
                          />
                        </label>
                        <label className="mt-1 flex items-center gap-2">
                          <Checkbox
                            checked={row.fields.bestellen}
                            onCheckedChange={() =>
                              row.onFieldChange({ bestellen: !row.fields.bestellen })
                            }
                            disabled={row.busy}
                            aria-label={`Bestellen lijn ${row.displayLijnnr}`}
                          />
                          <span className="text-sm text-foreground">Bestellen</span>
                        </label>
                        <label className="mt-1 flex items-center gap-2">
                          <Checkbox
                            checked={row.fields.blokkeren}
                            onCheckedChange={() =>
                              row.onFieldChange({ blokkeren: !row.fields.blokkeren })
                            }
                            disabled={row.busy}
                            aria-label={`Blokkeren lijn ${row.displayLijnnr}`}
                          />
                          <span className="text-sm text-foreground">Blokkeren</span>
                        </label>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}

          {/* Nieuwe lijn toevoegen */}
          <TableRow>
            <TableCell />
            <TableCell />
            <TableCell>
              <select
                value={newLineKind}
                onChange={(e) => setNewLineKind(e.target.value as LineKind)}
                aria-label="Type nieuwe lijn"
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
              >
                {NEW_LINE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </TableCell>
            {newLineKind === "artikel" ? (
              <>
                <TableCell>
                  <Input
                    value={newLineFields.artnr}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({ ...prev, artnr: e.target.value }))
                    }
                    aria-label="Artnr nieuwe lijn"
                    className="w-28"
                  />
                </TableCell>
                <TableCell className="whitespace-normal">
                  <Input
                    value={newLineFields.omschrijvingOfferte}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({ ...prev, omschrijvingOfferte: e.target.value }))
                    }
                    aria-label="Omschrijving nieuwe lijn"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={newLineFields.aantal}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({ ...prev, aantal: Number(e.target.value) }))
                    }
                    aria-label="Aantal nieuwe lijn"
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={newLineFields.teLeveren}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({ ...prev, teLeveren: Number(e.target.value) }))
                    }
                    aria-label="Te leveren nieuwe lijn"
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={newLineFields.verkoopprijs}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({
                        ...prev,
                        verkoopprijs: Number(e.target.value),
                      }))
                    }
                    aria-label="Vprijs nieuwe lijn"
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={newLineFields.korting}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({ ...prev, korting: Number(e.target.value) }))
                    }
                    aria-label="Korting nieuwe lijn"
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={newLineFields.bedrag}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({ ...prev, bedrag: Number(e.target.value) }))
                    }
                    aria-label="Bedrag nieuwe lijn"
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={newLineFields.aankoopprijs}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({
                        ...prev,
                        aankoopprijs: Number(e.target.value),
                      }))
                    }
                    aria-label="Aankoopprijs nieuwe lijn"
                    className="w-24"
                  />
                </TableCell>
                <TableCell />
              </>
            ) : (
              <TableCell colSpan={8} className="whitespace-normal">
                <Input
                  value={newLineFields.omschrijvingOfferte}
                  onChange={(e) =>
                    setNewLineFields((prev) => ({ ...prev, omschrijvingOfferte: e.target.value }))
                  }
                  aria-label="Omschrijving nieuwe lijn"
                />
              </TableCell>
            )}
            <TableCell>
              <Button
                type="button"
                size="sm"
                onClick={mode === "local" ? addLocal : addPersisted}
                disabled={mode === "persisted" && busyKey === "add"}
              >
                <Plus />
                Lijn toevoegen
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
