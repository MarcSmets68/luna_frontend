"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export type LocalLijn = {
  clientId: string;
  artnr: string;
  omschrijving: string;
  aantal: number;
  teLeveren: number;
  vprijs: number;
  korting: number;
  btwKode: string;
  bedrag: number;
  levDatum: string;
  opm: string;
  subtotaal: boolean;
  kolomtitel: boolean;
  infolijn: boolean;
};

type LineFields = Omit<LocalLijn, "clientId">;

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
    aantal: 0,
    teLeveren: 0,
    vprijs: 0,
    korting: 0,
    btwKode: "",
    bedrag: 0,
    levDatum: "",
    opm: "",
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

export function OrderLijnenEditor({
  lijnen,
  onChange,
}: {
  lijnen: LocalLijn[];
  onChange: (lijnen: LocalLijn[]) => void;
}) {
  const [newLineKind, setNewLineKind] = useState<LineKind>("artikel");
  const [newLineFields, setNewLineFields] = useState<LineFields>(emptyLineFields());

  function updateLine(clientId: string, patch: Partial<LineFields>) {
    onChange(lijnen.map((lijn) => (lijn.clientId === clientId ? { ...lijn, ...patch } : lijn)));
  }

  function deleteLine(clientId: string) {
    onChange(lijnen.filter((lijn) => lijn.clientId !== clientId));
  }

  function moveLine(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lijnen.length) return;
    const next = [...lijnen];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  function addLine() {
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
    onChange([...lijnen, newLijn]);
    setNewLineFields(emptyLineFields());
    setNewLineKind("artikel");
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
  };

  const rows: Row[] = lijnen.map((lijn, index) => ({
    key: lijn.clientId,
    displayLijnnr: (index + 1) * 10,
    kind: classifyLineKind(lijn),
    fields: lijn,
    isFirst: index === 0,
    isLast: index === lijnen.length - 1,
    onFieldChange: (patch) => updateLine(lijn.clientId, patch),
    onDelete: () => deleteLine(lijn.clientId),
    onMoveUp: () => moveLine(index, "up"),
    onMoveDown: () => moveLine(index, "down"),
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
            <TableHead>Omschrijving</TableHead>
            <TableHead>Aantal</TableHead>
            <TableHead>Te leveren</TableHead>
            <TableHead>Vprijs</TableHead>
            <TableHead>Korting</TableHead>
            <TableHead>Btw-kode</TableHead>
            <TableHead>Bedrag</TableHead>
            <TableHead>Leverdatum</TableHead>
            <TableHead>Opmerking</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={14} className="text-sm text-muted-foreground">
                Geen lijnen.
              </TableCell>
            </TableRow>
          ) : null}
          {rows.map((row) => {
            const moveButtons = (
              <div className="flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Omhoog"
                  disabled={row.isFirst}
                  onClick={row.onMoveUp}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Omlaag"
                  disabled={row.isLast}
                  onClick={row.onMoveDown}
                >
                  <ArrowDown />
                </Button>
              </div>
            );

            const deleteButton = (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Verwijder lijn ${row.displayLijnnr}`}
                onClick={row.onDelete}
              >
                <Trash2 />
              </Button>
            );

            if (isSpecialKind(row.kind)) {
              return (
                <TableRow key={row.key}>
                  <TableCell>{moveButtons}</TableCell>
                  <TableCell className="font-semibold">{row.displayLijnnr}</TableCell>
                  <TableCell>
                    <KindBadge kind={row.kind} />
                  </TableCell>
                  <TableCell
                    colSpan={9}
                    className={cn("whitespace-normal", row.kind === "titel" && TITLE_LINE_TEXT_CLASS)}
                  >
                    <Input
                      value={row.fields.omschrijving}
                      onChange={(e) => row.onFieldChange({ omschrijving: e.target.value })}
                      aria-label={`Omschrijving lijn ${row.displayLijnnr}`}
                    />
                  </TableCell>
                  <TableCell>{deleteButton}</TableCell>
                </TableRow>
              );
            }

            return (
              <TableRow key={row.key}>
                <TableCell>{moveButtons}</TableCell>
                <TableCell className="font-semibold">{row.displayLijnnr}</TableCell>
                <TableCell>
                  <KindBadge kind={row.kind} />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.fields.artnr}
                    onChange={(e) => row.onFieldChange({ artnr: e.target.value })}
                    aria-label={`Artnr lijn ${row.displayLijnnr}`}
                    className="w-28"
                  />
                </TableCell>
                <TableCell className="whitespace-normal">
                  <Input
                    value={row.fields.omschrijving}
                    onChange={(e) => row.onFieldChange({ omschrijving: e.target.value })}
                    aria-label={`Omschrijving lijn ${row.displayLijnnr}`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={row.fields.aantal}
                    onChange={(e) => row.onFieldChange({ aantal: Number(e.target.value) })}
                    aria-label={`Aantal lijn ${row.displayLijnnr}`}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={row.fields.teLeveren}
                    onChange={(e) => row.onFieldChange({ teLeveren: Number(e.target.value) })}
                    aria-label={`Te leveren lijn ${row.displayLijnnr}`}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={row.fields.vprijs}
                    onChange={(e) => row.onFieldChange({ vprijs: Number(e.target.value) })}
                    aria-label={`Vprijs lijn ${row.displayLijnnr}`}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={row.fields.korting}
                    onChange={(e) => row.onFieldChange({ korting: Number(e.target.value) })}
                    aria-label={`Korting lijn ${row.displayLijnnr}`}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.fields.btwKode}
                    onChange={(e) => row.onFieldChange({ btwKode: e.target.value })}
                    aria-label={`Btw-kode lijn ${row.displayLijnnr}`}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={row.fields.bedrag}
                    onChange={(e) => row.onFieldChange({ bedrag: Number(e.target.value) })}
                    aria-label={`Bedrag lijn ${row.displayLijnnr}`}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={row.fields.levDatum}
                    onChange={(e) => row.onFieldChange({ levDatum: e.target.value })}
                    aria-label={`Leverdatum lijn ${row.displayLijnnr}`}
                    className="w-36"
                  />
                </TableCell>
                <TableCell className="whitespace-normal">
                  <Input
                    value={row.fields.opm}
                    onChange={(e) => row.onFieldChange({ opm: e.target.value })}
                    aria-label={`Opmerking lijn ${row.displayLijnnr}`}
                  />
                </TableCell>
                <TableCell>{deleteButton}</TableCell>
              </TableRow>
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
                    value={newLineFields.omschrijving}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({ ...prev, omschrijving: e.target.value }))
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
                    value={newLineFields.vprijs}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({ ...prev, vprijs: Number(e.target.value) }))
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
                    value={newLineFields.btwKode}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({ ...prev, btwKode: e.target.value }))
                    }
                    aria-label="Btw-kode nieuwe lijn"
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
                    type="date"
                    value={newLineFields.levDatum}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({ ...prev, levDatum: e.target.value }))
                    }
                    aria-label="Leverdatum nieuwe lijn"
                    className="w-36"
                  />
                </TableCell>
                <TableCell className="whitespace-normal">
                  <Input
                    value={newLineFields.opm}
                    onChange={(e) =>
                      setNewLineFields((prev) => ({ ...prev, opm: e.target.value }))
                    }
                    aria-label="Opmerking nieuwe lijn"
                  />
                </TableCell>
              </>
            ) : (
              <TableCell colSpan={9} className="whitespace-normal">
                <Input
                  value={newLineFields.omschrijving}
                  onChange={(e) =>
                    setNewLineFields((prev) => ({ ...prev, omschrijving: e.target.value }))
                  }
                  aria-label="Omschrijving nieuwe lijn"
                />
              </TableCell>
            )}
            <TableCell>
              <Button type="button" size="sm" onClick={addLine}>
                <Plus />
                Lijn toevoegen
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
