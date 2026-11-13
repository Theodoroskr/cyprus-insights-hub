import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { BrandId, brands } from "@/config/brands";
import { HubNavigation } from "@/components/hub/HubNavigation";
import { HubFooter } from "@/components/hub/HubFooter";
import { LeaderboardAdSlot } from "@/components/banners/LeaderboardAdSlot";

interface HubLayoutProps {
  brand: BrandId;
  children: ReactNode;
  onSearch?: (query: string) => void;
  /** Hub front pages show their own half-width top banner instead of the inner-page strip. */
  landing?: boolean;
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

  return (
    <div className="min-h-screen bg-background">
      <HubNavigation brand={brandConfig} onSearch={handleSearch} />
      {!landing && <LeaderboardAdSlot slotId="hub-top" />}
      <main>{children}</main>
      <HubFooter brand={brandConfig} />
    </div>
  );
}
