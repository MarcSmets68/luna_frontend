import { TableCell, TableRow } from "@/components/ui/table";
import { formatBedrag, formatDatum } from "@/lib/format";
import type { BonLijnItem } from "@/lib/api-client";

/**
 * Enkele rij in de "Lijnen"-tabel van een bon-detailpagina. Rendert per
 * regeltype anders (zie backend contract voor bonlijn):
 * - `kolomtitel` - koprij, enkel omschrijving, volle breedte.
 * - `subtotaal` - somrij, enkel bedrag (+omschrijving).
 * - `infolijn` - infotekst, enkel omschrijving.
 * - anders - normale artikelregel (alle kolommen).
 */
export function BonLijnRow({ lijn }: { lijn: BonLijnItem }) {
  if (lijn.kolomtitel) {
    return (
      <TableRow className="bg-muted font-semibold">
        <TableCell colSpan={9} className="whitespace-normal">
          {lijn.omschrijving}
        </TableCell>
      </TableRow>
    );
  }

  if (lijn.subtotaal) {
    return (
      <TableRow className="border-t-2 font-semibold">
        <TableCell colSpan={7} className="whitespace-normal">
          {lijn.omschrijving}
        </TableCell>
        <TableCell colSpan={2}>{formatBedrag(lijn.bedrag)}</TableCell>
      </TableRow>
    );
  }

  if (lijn.infolijn) {
    return (
      <TableRow className="italic text-muted-foreground">
        <TableCell colSpan={9} className="whitespace-normal">
          {lijn.omschrijving}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-semibold">{lijn.lijnnr}</TableCell>
      <TableCell>{lijn.artnr}</TableCell>
      <TableCell className="whitespace-normal">{lijn.omschrijving}</TableCell>
      <TableCell>{lijn.aantal}</TableCell>
      <TableCell>{lijn.teLeveren}</TableCell>
      <TableCell>{formatBedrag(lijn.vprijs)}</TableCell>
      <TableCell>{lijn.korting}</TableCell>
      <TableCell>{formatBedrag(lijn.bedrag)}</TableCell>
      <TableCell>{formatDatum(lijn.levDatum)}</TableCell>
    </TableRow>
  );
} 
