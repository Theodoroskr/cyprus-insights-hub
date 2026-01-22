import { ReactNode } from "react";
import { BrandId, brands } from "@/config/brands";
import { HubNavigation } from "@/components/hub/HubNavigation";
import { HubFooter } from "@/components/hub/HubFooter";

interface HubLayoutProps {
  brand: BrandId;
  children: ReactNode;
  onSearch?: (query: string) => void;
}

export function HubLayout({ brand, children, onSearch }: HubLayoutProps) {
  const brandConfig = brands[brand];

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    } else {
      console.log(`Search in ${brandConfig.name}:`, query);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HubNavigation brand={brandConfig} onSearch={handleSearch} />
      <main>{children}</main>
      <HubFooter brand={brandConfig} />
    </div>
  );
}
