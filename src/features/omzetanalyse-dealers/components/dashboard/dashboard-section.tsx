import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardSection({
  title,
  note,
  actions,
  children,
}: {
  title: string;
  note?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-none border-border shadow-none">
      <CardHeader className="border-b border-border py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
          {actions}
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {note && <div className="mb-3 text-[12px] text-muted-foreground">{note}</div>}
        {children}
      </CardContent>
    </Card>
  );
}
