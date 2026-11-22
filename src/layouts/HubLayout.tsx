import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandId, brands } from "@/config/brands";
import { HubNavigation } from "@/components/hub/HubNavigation";
import { HubFooter } from "@/components/hub/HubFooter";
import { LeaderboardAdSlot } from "@/components/banners/LeaderboardAdSlot";
import { AdSlot } from "@/components/banners/AdSlot";
import { BusinessTicker } from "@/components/BusinessTicker";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { HUB_TOP_SLOTS, HUB_MID_SLOTS, HUB_FOOTER_SLOTS } from "@/components/hub/HubMasthead";

interface HubLayoutProps {
  brand: BrandId;
  children: ReactNode;
  onSearch?: (query: string) => void;
  /** Hub front pages use the BusinessHub.cy homepage frame: top, mid and footer banners, related hubs, newsletter. */
  landing?: boolean;
}

const HUB_ORDER: BrandId[] = ["fintechhub", "compliancehub", "regtechhub", "tourismhub", "energyhub"];

/** The other hubs, shown like the homepage's three-column hub row. */
function RelatedHubs({ brand }: { brand: BrandId }) {
  const others = HUB_ORDER.filter((b) => b !== brand && brands[b]).slice(0, 4);
  return (
    <section className="section-rule" aria-label="Other hubs">
      <div className="container mx-auto px-4 py-8">
        <h2 className="section-label mb-4">More from BHub Network</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/" className="border border-border p-4 hover:border-foreground transition-colors">
            <p className="font-serif font-bold text-foreground">BusinessHub<span className="text-secondary">.cy</span></p>
            <p className="text-xs text-muted-foreground mt-1">Cyprus business news, companies and data</p>
          </Link>
          {others.slice(0, 3).map((b) => (
            <Link key={b} to={brands[b].home} className="border border-border p-4 hover:border-foreground transition-colors">
              <p className="font-serif font-bold text-foreground">{brands[b].name}<span className="text-secondary">{brands[b].domain}</span></p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{brands[b].tagline}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HubLayout({ brand, children, onSearch, landing }: HubLayoutProps) {
  const brandConfig = brands[brand];
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    if (onSearch) onSearch(query);
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };
  const top = HUB_TOP_SLOTS[brand];
  const mid = HUB_MID_SLOTS[brand];
  const foot = HUB_FOOTER_SLOTS[brand];

  return (
    <div className="min-h-screen bg-background">
      {landing && <BusinessTicker />}
      <HubNavigation brand={brandConfig} onSearch={handleSearch} />
      {landing && top && <div className="py-3"><div className="container mx-auto px-4"><AdSlot size="wide-banner" slotId={top} /></div></div>}
      {!landing && <LeaderboardAdSlot slotId="hub-top" />}
      <main>
        {children}
        {landing && mid && <LeaderboardAdSlot slotId={mid} />}
        {landing && <RelatedHubs brand={brand} />}
      </main>
      {landing && <NewsletterSignup />}
      {landing && foot && <LeaderboardAdSlot slotId={foot} />}
      <HubFooter brand={brandConfig} />
    </div>
  );
}
