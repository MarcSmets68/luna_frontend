"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ReservatieDetail } from "@/features/npp/reservaties/components/reservatie-detail";

function DetailContent() {
  const params = useParams<{ bonnr: string }>();
  const searchParams = useSearchParams();
  const bonnr = Number(params.bonnr);
  const groepnrParam = Number(searchParams.get("groepnr"));
  const groepnr =
    Number.isInteger(groepnrParam) && groepnrParam > 0
      ? groepnrParam
      : undefined;
  // Only productie rows carry a groepnr, so that implies the productie tab.
  const backHref = groepnr
    ? "/npp/reservaties?mode=productie"
    : "/npp/reservaties";

  return (
    <div className="flex w-full flex-col">
      <div className="px-6 pt-6 sm:px-8">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Terug naar reservaties
        </Link>
      </div>
      {Number.isInteger(bonnr) && bonnr > 0 ? (
        <ReservatieDetail bonnr={bonnr} groepnr={groepnr} />
      ) : (
        <p role="alert" className="p-6 text-sm text-destructive sm:p-8">
          Ongeldig bonnummer.
        </p>
      )}
    </div>
  );
}

export default function NppReservatieDetailPage() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar />
      <main className="flex flex-1 overflow-auto">
        <Suspense fallback={null}>
          <DetailContent />
        </Suspense>
      </main>
    </div>
  );
}
