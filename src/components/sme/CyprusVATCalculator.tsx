import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Euro,
  Info,
  ArrowRight,
  ExternalLink,
  Globe,
} from "lucide-react";

const vatRates = [
  { rate: 19, label: "Standard Rate", description: "Most goods and services", examples: ["Electronics", "Clothing", "Professional services", "Cars"] },
  { rate: 9, label: "Reduced Rate", description: "Hospitality & tourism", examples: ["Hotel accommodation", "Restaurant services", "Catering"] },
  { rate: 5, label: "Reduced Rate", description: "Essential goods", examples: ["Food & non-alcoholic drinks", "Books & newspapers", "Medicines", "Passenger transport", "Renovation of private housing"] },
  { rate: 3, label: "Super-Reduced Rate", description: "Specific essentials", examples: ["Baby food", "Baby milk", "Children's car seats"] },
  { rate: 0, label: "Zero Rate", description: "Exemptions with credit", examples: ["Exports outside EU", "International transport", "Intra-community supplies"] },
];

const mossCountries = [
  { country: "Austria", rate: 20 }, { country: "Belgium", rate: 21 }, { country: "Bulgaria", rate: 20 },
  { country: "Croatia", rate: 25 }, { country: "Czech Republic", rate: 21 }, { country: "Denmark", rate: 25 },
  { country: "Estonia", rate: 22 }, { country: "Finland", rate: 25.5 }, { country: "France", rate: 20 },
  { country: "Germany", rate: 19 }, { country: "Greece", rate: 24 }, { country: "Hungary", rate: 27 },
  { country: "Ireland", rate: 23 }, { country: "Italy", rate: 22 }, { country: "Latvia", rate: 21 },
  { country: "Lithuania", rate: 21 }, { country: "Luxembourg", rate: 17 }, { country: "Malta", rate: 18 },
  { country: "Netherlands", rate: 21 }, { country: "Poland", rate: 23 }, { country: "Portugal", rate: 23 },
  { country: "Romania", rate: 19 }, { country: "Slovakia", rate: 23 }, { country: "Slovenia", rate: 22 },
  { country: "Spain", rate: 21 }, { country: "Sweden", rate: 25 },
];

type CalcMode = "simple" | "reverse" | "cross-border";

export function CyprusVATCalculator() {
  const [mode, setMode] = useState<CalcMode>("simple");
  const [amount, setAmount] = useState("");
  const [selectedRate, setSelectedRate] = useState(19);
  const [selectedCountry, setSelectedCountry] = useState("");

  const numAmount = parseFloat(amount) || 0;

  const result = useMemo(() => {
    if (mode === "simple") {
      const vat = numAmount * (selectedRate / 100);
      return { net: numAmount, vat, total: numAmount + vat, rate: selectedRate };
    }
    if (mode === "reverse") {
      const net = numAmount / (1 + selectedRate / 100);
      const vat = numAmount - net;
      return { net, vat, total: numAmount, rate: selectedRate };
    }
    // cross-border
    const country = mossCountries.find((c) => c.country === selectedCountry);
    const rate = country?.rate || 19;
    const vat = numAmount * (rate / 100);
    return { net: numAmount, vat, total: numAmount + vat, rate };
  }, [mode, numAmount, selectedRate, selectedCountry]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-CY", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

  return (
    <div className="border border-border bg-card">
      <div className="px-5 py-4 border-b-2 border-foreground">
        <h3 className="font-serif font-bold text-lg text-foreground">Cyprus VAT Calculator</h3>
        <p className="text-xs text-muted-foreground mt-1">Current rates · EU cross-border (OSS/MOSS) · Reverse calculation</p>
      </div>

      {/* Mode Selector */}
      <div className="px-5 py-3 border-b border-border flex gap-2">
        {([
          { id: "simple" as CalcMode, label: "Add VAT" },
          { id: "reverse" as CalcMode, label: "Extract VAT" },
          { id: "cross-border" as CalcMode, label: "EU Cross-Border" },
        ]).map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] font-semibold transition-colors border ${
              mode === m.id
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground block mb-2">
                {mode === "reverse" ? "Total Amount (incl. VAT)" : "Net Amount (excl. VAT)"}
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-3 border border-border bg-background text-foreground text-lg font-serif focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>

            {mode !== "cross-border" ? (
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground block mb-2">
                  VAT Rate
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {vatRates.map((r) => (
                    <button
                      key={r.rate}
                      onClick={() => setSelectedRate(r.rate)}
                      className={`py-2.5 text-center transition-colors border ${
                        selectedRate === r.rate
                          ? "bg-foreground text-background border-foreground"
                          : "bg-transparent text-foreground border-border hover:border-foreground"
                      }`}
                    >
                      <span className="text-sm font-bold block">{r.rate}%</span>
                      <span className="text-[8px] uppercase tracking-wider text-muted-foreground block mt-0.5">{r.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground block mb-2">
                  Customer's EU Country
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-3 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-foreground"
                >
                  <option value="">Select country...</option>
                  {mossCountries.map((c) => (
                    <option key={c.country} value={c.country}>
                      {c.country} — {c.rate}%
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="border border-border p-5">
            <h4 className="section-label text-xs mb-4">Calculation Result</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Net Amount</span>
                <span className="text-lg font-serif font-bold text-foreground">{formatCurrency(result.net)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  VAT ({result.rate}%)
                  {mode === "cross-border" && selectedCountry && (
                    <span className="ml-1 text-xs">({selectedCountry})</span>
                  )}
                </span>
                <span className="text-lg font-serif font-bold text-secondary">{formatCurrency(result.vat)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-2xl font-serif font-bold text-foreground">{formatCurrency(result.total)}</span>
              </div>
            </div>

            {mode === "cross-border" && (
              <div className="mt-4 p-3 bg-muted/50 border border-border">
                <div className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">One-Stop Shop (OSS)</p>
                    <p>Under the EU OSS scheme, digital services and distance sales to consumers must charge VAT at the buyer's country rate. Register via the Cyprus Tax Department for simplified reporting.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VAT Rate Reference */}
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="section-label text-xs mb-3">Cyprus VAT Rate Reference</h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {vatRates.slice(0, 3).map((r) => (
              <div key={r.rate} className="p-3 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-serif font-bold text-foreground">{r.rate}%</span>
                  <Badge className="rounded-none bg-foreground/5 text-muted-foreground text-[9px] uppercase tracking-wider border border-border">
                    {r.label}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.examples.map((ex, i) => (
                    <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 text-muted-foreground">{ex}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <a
              href="https://www.mof.gov.cy/mof/TAX/taxdep.nsf/index_en/index_en?OpenDocument"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-wider text-secondary font-semibold flex items-center gap-1 hover:underline"
            >
              Cyprus Tax Department <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-muted-foreground text-[10px]">·</span>
            <a
              href="https://ec.europa.eu/taxation_customs/business/vat/telecommunications-broadcasting-electronic-services/content/guide-vat-mini-one-stop-shop_en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-wider text-secondary font-semibold flex items-center gap-1 hover:underline"
            >
              EU OSS Guide <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
