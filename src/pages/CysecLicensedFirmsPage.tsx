import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Search, ExternalLink, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  filterLicences, groupByLicenceType, isCurrentLicence, licenceTypeLabel, type LicenceRow,
} from "@/lib/licensedFirms";

const CYSEC_REGISTER_URL = "https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/";

type CompanyLink = { slug: string | null; city: string | null };

export default function CysecLicensedFirmsPage() {
  const [rows, setRows] = useState<LicenceRow[]>([]);
  const [companies, setCompanies] = useState<Record<string, CompanyLink>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("regulated_entities")
        .select("id, entity_name, license_type, license_number, status, license_date, last_seen_at, matched_company_id")
        .eq("source", "cysec")
        .order("entity_name")
        .limit(2000);
      const list = (data ?? []) as LicenceRow[];
      setRows(list);
      const ids = [...new Set(list.map((r) => r.matched_company_id).filter(Boolean))] as string[];
      const map: Record<string, CompanyLink> = {};
      for (let i = 0; i < ids.length; i += 150) {
        const { data: cs } = await supabase.from("directory_companies").select("id, slug, city").in("id", ids.slice(i, i + 150));
        for (const c of cs ?? []) map[c.id] = { slug: c.slug, city: c.city };
      }
      setCompanies(map);
      setLoading(false);
    })();
  }, []);

  const current = useMemo(() => rows.filter((r) => isCurrentLicence(r.status)), [rows]);
  const typeCounts = useMemo(() => groupByLicenceType(current).map((g) => ({ type: g.type, count: g.rows.length })), [current]);
  const groups = useMemo(() => groupByLicenceType(filterLicences(rows, { includeInactive, query, type })), [rows, includeInactive, query, type]);
  const lastChecked = useMemo(() => {
    const ts = rows.map((r) => r.last_seen_at).filter(Boolean).sort().pop();
    return ts ? new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;
  }, [rows]);
  const shown = groups.reduce((n, g) => n + g.rows.length, 0);

  return (
    <div className="min-h-screen bg-background select-none" onCopy={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()}>
      <SEOHead
        title="CySEC-Licensed Firms in Cyprus — Full List by Licence Type"
        description={`List of ${current.length > 0 ? current.length : "all"} firms holding a current CySEC licence: Cyprus Investment Firms (CIFs), fund managers (AIFMs, UCITS), administrative service providers and MiCA crypto-asset service providers, with licence numbers.`}
        path="/directory/cysec-licensed-firms"
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Directory", href: "/directory" },
          { name: "CySEC-licensed firms", href: "/directory/cysec-licensed-firms" },
        ]}
      />
      <TopNavigation onSearch={() => {}} />

      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
          <nav className="text-sm text-primary-foreground/70 mb-4">
            <Link to="/directory" className="hover:text-primary-foreground">Directory</Link> / CySEC-licensed firms
          </nav>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 md:h-10 md:w-10 shrink-0" /> CySEC-licensed firms
          </h1>
          <p className="text-primary-foreground/80 max-w-3xl text-lg leading-relaxed">
            Every firm that holds a current licence from the Cyprus Securities and Exchange Commission (CySEC), grouped by
            licence type, with its licence number and a link to its company profile.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Summary */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => setType(null)}
            className={`text-left rounded-lg border p-4 transition-colors ${type === null ? "border-secondary bg-secondary/10" : "border-border bg-card hover:border-secondary/40"}`}
          >
            <p className="text-2xl font-serif font-bold text-foreground">{loading ? "…" : current.length}</p>
            <p className="text-sm text-muted-foreground">All current licences</p>
          </button>
          {typeCounts.slice(0, 7).map((t) => (
            <button
              key={t.type}
              onClick={() => setType(type === t.type ? null : t.type)}
              className={`text-left rounded-lg border p-4 transition-colors ${type === t.type ? "border-secondary bg-secondary/10" : "border-border bg-card hover:border-secondary/40"}`}
            >
              <p className="text-2xl font-serif font-bold text-foreground">{t.count}</p>
              <p className="text-sm text-muted-foreground">{t.type}</p>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Firm name or licence number…" className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="inactive" checked={includeInactive} onCheckedChange={setIncludeInactive} />
            <Label htmlFor="inactive" className="text-sm text-muted-foreground">Include former and inactive licences</Label>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {loading ? "Loading licences…" : `${shown} ${shown === 1 ? "licence" : "licences"} shown`}
          {type ? ` · ${type}` : ""}
        </p>

        {groups.map((g) => (
          <section key={g.type} className="mb-10">
            <h2 className="text-xl font-serif font-bold text-foreground mb-3">
              {g.type} <span className="text-muted-foreground font-normal text-base">({g.rows.length})</span>
            </h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">Firm</th>
                    <th className="px-4 py-2 font-medium hidden sm:table-cell">Licence no.</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => {
                    const c = r.matched_company_id ? companies[r.matched_company_id] : undefined;
                    return (
                      <tr key={r.id} className="border-t border-border">
                        <td className="px-4 py-2.5">
                          {c?.slug ? (
                            <Link to={`/directory/company/${c.slug}`} className="font-medium text-foreground hover:text-secondary">
                              {r.entity_name}
                            </Link>
                          ) : (
                            <span className="font-medium text-foreground">{r.entity_name}</span>
                          )}
                          {c?.city && <span className="block text-xs text-muted-foreground">{c.city}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{r.license_number || "—"}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={isCurrentLicence(r.status) ? "border-success/40 text-success" : "text-muted-foreground"}>
                            {r.status || "Unknown"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {!loading && shown === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            No licences match your search.
          </div>
        )}

        {/* Explainer */}
        <section className="mt-12 rounded-xl border border-border bg-card p-6 space-y-4 text-foreground leading-relaxed">
          <h2 className="text-xl font-serif font-bold">About this list</h2>
          <p>
            CySEC supervises investment firms and other financial-services providers based in Cyprus. The main licence types here are
            Cyprus Investment Firms (CIFs), which can offer investment services such as brokerage and portfolio management;
            Alternative Investment Fund Managers (AIFMs) and UCITS management companies, which manage investment funds;
            Administrative Service Providers (ASPs), which provide company administration and fiduciary services; and
            crypto-asset service providers authorised under the EU's MiCA regulation.
          </p>
          <p>
            Licence details come only from CySEC's official registers{lastChecked ? `, last checked on ${lastChecked}` : ""}.
            A firm listed here holds a licence; that is not an endorsement. Warnings about unauthorised firms are a separate list
            and never appear here. Before you deal with a firm, confirm its status on CySEC's own register.
          </p>
          <a href={CYSEC_REGISTER_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-secondary font-medium hover:underline">
            CySEC official register <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-sm text-muted-foreground">
            Looking for a bank, e-money or payment institution? Use the <Link to="/directory" className="text-secondary hover:underline">company directory</Link> and
            filter by "CBC Supervised".
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
