// Mockup data for the Nomaled dashboard — temporary until the PASOE
// endpoints for the coating/orders module exist. Replace with calls
// through the shared typed API client once the backend contract lands.

export type StatCard = {
  label: string;
  value: string;
  hint: string;
  hintColor?: "default" | "positive" | "warning";
};

export const statCards: StatCard[] = [
  {
    label: "Open offertes",
    value: "12",
    hint: "€ 48.200 potentieel",
    hintColor: "positive",
  },
  {
    label: "Orders in productie",
    value: "9",
    hint: "2 leveren deze week",
  },
  {
    label: "Omzet deze maand",
    value: "€ 86.400",
    hint: "↑ 14% vs juli",
    hintColor: "positive",
  },
  {
    label: "Lage voorraad",
    value: "3",
    hint: "items onder reorder point",
    hintColor: "warning",
  },
];

export type ActivityItem = {
  text: string;
  time: string;
};

export const recentActivity: ActivityItem[] = [
  { text: "Offerte QT-2025-060 verstuurd naar De Meubelmakers", time: "10 min geleden" },
  { text: "Order ORD-2025-091 verplaatst naar Assemblage", time: "1u geleden" },
  { text: "Factuur INV-2025-070 gemarkeerd als betaald", time: "3u geleden" },
  { text: "Nieuwe lead: Studio Renouprez", time: "gisteren" },
  { text: "Voorraad Montageclips RVS onder reorder point", time: "gisteren" },
];

export type ProductionStage = "Design" | "Materiaal" | "Assemblage" | "QC" | "Verzonden";

export type ProductionOrder = {
  id: string;
  customer: string;
  product: string;
  due: string;
  value: string;
  stage: ProductionStage;
};

export const stageStyles: Record<ProductionStage, string> = {
  Design: "bg-secondary text-[#5e5e5e]",
  Materiaal: "bg-[#f5e8c4] text-[#8a6820]",
  Assemblage: "bg-accent text-primary",
  QC: "bg-[#d8eeda] text-[#3d7a45]",
  Verzonden: "bg-[#d0e4f4] text-[#2a5080]",
};

export const productionThisWeek: ProductionOrder[] = [
  {
    id: "ORD-2025-091",
    customer: "Architectenbureau Peeters & Co",
    product: "Lineair LED profiel XS — 42m",
    due: "22 aug",
    value: "€ 26.900",
    stage: "Assemblage",
  },
  {
    id: "ORD-2025-090",
    customer: "Bouwbedrijf De Ridder",
    product: "Trapverlichting maatwerk",
    due: "18 aug",
    value: "€ 9.200",
    stage: "QC",
  },
  {
    id: "ORD-2025-089",
    customer: "Studio Vantomme",
    product: "Kantoorverlichting — hanglampen ×6",
    due: "29 aug",
    value: "€ 18.400",
    stage: "Materiaal",
  },
  {
    id: "ORD-2025-086",
    customer: "LichtPartners BV",
    product: "Showroom spots ×24",
    due: "14 aug",
    value: "€ 12.100",
    stage: "Verzonden",
  },
  {
    id: "ORD-2025-082",
    customer: "Interieur Van Loo",
    product: "Inbouwprofiel keuken",
    due: "5 sep",
    value: "€ 4.750",
    stage: "Design",
  },
];
