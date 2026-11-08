import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const eur = (v: number | null | undefined) =>
  v == null ? "—" : `€${(Number(v) / 1_000_000).toLocaleString("en-GB", { maximumFractionDigits: 1 })}m`;
const pct = (v: number | null | undefined) =>
  v == null ? "—" : `${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(1)}%`;

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-border p-4 bg-card">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-serif font-bold text-foreground">{value}</p>
      {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
    </div>
  );
}

export function TradeSnapshotReport() {
  const { data, isLoading } = useQuery({
    queryKey: ["resource-trade-snapshot"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trade_kpi_snapshots")
        .select("*, trade_countries(country_name)")
        .order("date_month", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data) return <p className="text-muted-foreground">Trade data is not available right now.</p>;
  const month = new Date(data.date_month).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return (
    <div className="space-y-6">
      <p className="article-body">
        Latest month: <strong>{month}</strong>. Figures come from official CYSTAT import statistics and refresh automatically each month.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Total imports" value={eur(data.total_imports_eur)} />
        <Stat label="vs previous month" value={pct(data.mom_growth_pct)} />
        <Stat label="vs same month last year" value={pct(data.yoy_growth_pct)} />
        <Stat label="Top partner" value={(data as any).trade_countries?.country_name || "—"} note={eur(data.top_import_country_value_eur)} />
        <Stat label="Top sector" value={data.top_import_sector || "—"} note={eur(data.top_import_sector_value_eur)} />
        <Stat label="From EU countries" value={data.eu_share_pct == null ? "—" : `${Number(data.eu_share_pct).toFixed(1)}%`} />
      </div>
      <Link to="/trade" className="text-sm text-secondary font-semibold hover:underline">Open the full Trade Intelligence dashboard →</Link>
    </div>
  );
}

const count = async (col: "cysec_licensed" | "cbc_supervised", type?: string) => {
  let q = supabase.from("directory_companies").select("id", { count: "exact", head: true }).eq(col, true);
  if (type) q = q.eq(col === "cbc_supervised" ? "cbc_license_type" : "cysec_license_type", type);
  return (await q).count || 0;
};

export function FintechStateReport() {
  const { data, isLoading } = useQuery({
    queryKey: ["resource-fintech-state"],
    queryFn: async () => {
      const [cysec, cbc, byType] = await Promise.all([
        count("cysec_licensed"),
        count("cbc_supervised"),
        supabase.from("directory_companies").select("cysec_license_type, cbc_license_type, cysec_licensed, cbc_supervised")
          .or("cysec_licensed.eq.true,cbc_supervised.eq.true").limit(2000),
      ]);
      const types: Record<string, number> = {};
      (byType.data || []).forEach((r: any) => {
        if (r.cysec_licensed && r.cysec_license_type) types[`CySEC · ${r.cysec_license_type}`] = (types[`CySEC · ${r.cysec_license_type}`] || 0) + 1;
        if (r.cbc_supervised && r.cbc_license_type) types[`CBC · ${r.cbc_license_type}`] = (types[`CBC · ${r.cbc_license_type}`] || 0) + 1;
      });
      return { cysec, cbc, types: Object.entries(types).sort((a, b) => b[1] - a[1]) };
    },
  });
  if (isLoading || !data) return <Skeleton className="h-48 w-full" />;
  return (
    <div className="space-y-6">
      <p className="article-body">
        Live figures from the official CySEC and Central Bank of Cyprus registers, matched to companies in our directory. Updated every week.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Stat label="CySEC-licensed firms" value={data.cysec.toLocaleString()} />
        <Stat label="Central Bank-authorised firms" value={data.cbc.toLocaleString()} note="Banks, e-money and payment institutions" />
      </div>
      {data.types.length > 0 && (
        <div>
          <h2 className="font-serif font-bold text-lg mb-3">By licence type</h2>
          <div className="divide-y divide-border border border-border">
            {data.types.map(([t, n]) => (
              <div key={t} className="flex justify-between px-4 py-2 text-sm">
                <span>{t}</span><span className="font-semibold">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <Link to="/directory" className="text-sm text-secondary font-semibold hover:underline">Browse licensed firms in the directory →</Link>
    </div>
  );
}

export const LIVE_REPORTS: Record<string, () => JSX.Element> = {
  "trade-report-q1-2026": TradeSnapshotReport,
  "fintech-cyprus-2025": FintechStateReport,
};
