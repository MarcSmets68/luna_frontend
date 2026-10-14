"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseTab, useDashboardUrlState } from "../lib/use-dashboard-url-state";

/** Dashboard | Detailrapport shell; both panels are rendered by the server. */
export function OmzetanalyseTabs({
  dashboard,
  detail,
  initialTab,
}: {
  dashboard: React.ReactNode;
  detail: React.ReactNode;
  initialTab?: string | null;
}) {
  const { tab, setTab } = useDashboardUrlState({ tab: initialTab });
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(parseTab(v as string))}>
      <TabsList>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="detail">Detailrapport</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard" keepMounted>
        {dashboard}
      </TabsContent>
      <TabsContent value="detail" keepMounted>
        {detail}
      </TabsContent>
    </Tabs>
  );
}
