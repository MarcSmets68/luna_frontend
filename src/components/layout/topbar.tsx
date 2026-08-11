import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Topbar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-7">
      <Input
        type="text"
        placeholder="Zoek klanten, offertes, orders..."
        className="w-80 rounded-sm bg-background text-[13px]"
      />
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <div className="text-[13px] font-semibold text-foreground">Elke Peeters</div>
          <div className="text-[11px] text-muted-foreground">Sales &amp; Projecten</div>
        </div>
        <Avatar className="h-8 w-8 border border-primary bg-accent">
          <AvatarFallback className="bg-accent text-[12px] font-bold text-primary">
            EP
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
