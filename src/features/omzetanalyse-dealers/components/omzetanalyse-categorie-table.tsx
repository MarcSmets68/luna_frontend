import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OmzetCategorie } from "@/lib/api-client";
import { formatInteger, formatMoney, formatQty } from "../lib/omzetanalyse-format";
import { GrowthBadge } from "./growth-badge";

function Value({
  text,
  growth,
  showGrowth,
}: {
  text: string;
  growth: number | null;
  showGrowth: boolean;
}) {
  return (
    <div>
      <div>{text}</div>
      {showGrowth && <GrowthBadge value={growth} />}
    </div>
  );
}

export function OmzetanalyseCategorieTable({
  categorie,
  kolomLabels,
  showGrowth,
}: {
  categorie: OmzetCategorie;
  kolomLabels: string[];
  showGrowth: boolean;
}) {
  const { rijen, totalen, gemengdeEenheden } = categorie;
  const right = "text-right align-top";
  return (
    <div className="mb-8" data-testid="categorie-table">
      <h3 className="mb-2 text-[15px] font-semibold text-foreground">{categorie.categorie}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2}>Artnr</TableHead>
            <TableHead rowSpan={2}>Eenh.</TableHead>
            {kolomLabels.map((label, i) => (
              <TableHead key={i} colSpan={2} className="border-l text-center">
                {label}
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {kolomLabels.map((_, i) => (
              <React.Fragment key={i}>
                <TableHead className="border-l text-right">Los</TableHead>
                <TableHead className="text-right">Productie</TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rijen.map((rij) => (
            <TableRow key={rij.artnr}>
              <TableCell className="align-top font-medium">
                {rij.artnr}
                {rij.swBegins ? "\u2026" : ""}
              </TableCell>
              <TableCell className="align-top">
                {rij.eenheid && <Badge variant="outline">{rij.eenheid}</Badge>}
              </TableCell>
              {kolomLabels.map((_, i) => {
                const p = rij.perioden[i];
                return (
                  <React.Fragment key={i}>
                    <TableCell className={`${right} border-l`}>
                      <Value text={formatQty(p?.qtyLos ?? null)} growth={p?.groeiQtyLos ?? null} showGrowth={showGrowth} />
                    </TableCell>
                    <TableCell className={right}>
                      <Value text={formatQty(p?.qtyProductie ?? null)} growth={p?.groeiQtyProductie ?? null} showGrowth={showGrowth} />
                    </TableCell>
                  </React.Fragment>
                );
              })}
            </TableRow>
          ))}

          {!gemengdeEenheden && (
            <TableRow className="bg-muted/50 font-semibold" data-testid="qty-subtotal">
              <TableCell colSpan={2}>Totaal aantal</TableCell>
              {kolomLabels.map((_, i) => {
                const p = totalen[i];
                return (
                  <React.Fragment key={i}>
                    <TableCell className={`${right} border-l`}>
                      <Value text={formatQty(p?.qtyLos ?? null)} growth={p?.groeiQtyLos ?? null} showGrowth={showGrowth} />
                    </TableCell>
                    <TableCell className={right}>
                      <Value text={formatQty(p?.qtyProductie ?? null)} growth={p?.groeiQtyProductie ?? null} showGrowth={showGrowth} />
                    </TableCell>
                  </React.Fragment>
                );
              })}
            </TableRow>
          )}

          <TableRow className="bg-muted/50 font-semibold">
            <TableCell colSpan={2}>Aantal orders</TableCell>
            {kolomLabels.map((_, i) => {
              const p = totalen[i];
              return (
                <TableCell key={i} colSpan={2} className={`${right} border-l`}>
                  <Value text={formatInteger(p?.aantalOrders ?? null)} growth={p?.groeiAantalOrders ?? null} showGrowth={showGrowth} />
                </TableCell>
              );
            })}
          </TableRow>

          <TableRow className="bg-muted/50 font-semibold">
            <TableCell colSpan={2}>Omzet los / productie</TableCell>
            {kolomLabels.map((_, i) => {
              const p = totalen[i];
              return (
                <React.Fragment key={i}>
                  <TableCell className={`${right} border-l`}>
                    <Value text={formatMoney(p?.omzetLos ?? null)} growth={p?.groeiOmzetLos ?? null} showGrowth={showGrowth} />
                  </TableCell>
                  <TableCell className={right}>
                    <Value text={formatMoney(p?.omzetProductie ?? null)} growth={p?.groeiOmzetProductie ?? null} showGrowth={showGrowth} />
                  </TableCell>
                </React.Fragment>
              );
            })}
          </TableRow>

          <TableRow className="bg-muted/50 font-semibold">
            <TableCell colSpan={2}>Omzet totaal</TableCell>
            {kolomLabels.map((_, i) => {
              const p = totalen[i];
              return (
                <TableCell key={i} colSpan={2} className={`${right} border-l`}>
                  <Value text={formatMoney(p?.omzetTotaal ?? null)} growth={p?.groeiOmzetTotaal ?? null} showGrowth={showGrowth} />
                </TableCell>
              );
            })}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
