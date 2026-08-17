import { Badge } from "@/components/ui/badge";
import type { LakproductieBron, LakproductieStatus } from "@/lib/api-client";

const BRON_LABELS: Record<LakproductieBron, string> = {
  "lopende-orders": "Order",
  "lopende-productielijnen": "Productielijn",
  "min-max-voorraad": "Min-max",
};

/**
 * Small pill identifying which of the three backend sources
 * (LakproductieBE "a"/"b"/"c") an orderregel/rij came from.
 */
export function BronBadge({ bron }: { bron: LakproductieBron }) {
  return (
    <Badge variant="outline" className="text-[10.5px] font-medium">
      {BRON_LABELS[bron]}
    </Badge>
  );
}

const STATUS_VARIANTS: Record<LakproductieStatus, "default" | "secondary" | "outline"> = {
  Gereserveerd: "default",
  "Deels gereserveerd": "secondary",
  Besteld: "secondary",
  "Nog te bestellen": "outline",
};

/**
 * Status pill for "a"/"b" rows (lopende orders/productielijnen) - there is
 * no status for "min-max-voorraad" rows (no order/productielijn to
 * reserve/order against), so this is only rendered when `item.status` is
 * non-null.
 */
export function StatusBadge({ status }: { status: LakproductieStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className="text-[10.5px] font-medium">
      {status}
    </Badge>
  );
}
