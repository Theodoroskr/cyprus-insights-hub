import { Link } from "react-router-dom";
import { Building2, Mail, Phone, MapPin, Linkedin, Twitter } from "lucide-react";
import { BrandConfig, hubLinks, brands } from "@/config/brands";

interface HubFooterProps {
  brand: BrandConfig;
}

export function HubFooter({ brand }: HubFooterProps) {
  const LogoIcon = brand.icon;

  return (
    <footer className="navy-gradient text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <span className="font-bold text-sm text-secondary-foreground">{brand.logoLetter}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {brand.name}<span className="text-secondary">{brand.domain}</span>
                </h3>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/70 mb-4">
              {brand.tagline}
            </p>
            {brand.parentBadge && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-xs mb-4"
              >
                <Building2 className="h-3 w-3" />
                Part of BusinessHub.cy Group
              </Link>
            )}
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-8 h-8 rounded-full bg-navy-light hover:bg-secondary/20 flex items-center justify-center transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-navy-light hover:bg-secondary/20 flex items-center justify-center transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-secondary">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              {brand.navItems.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="hover:text-secondary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hub Network */}
          <div>
            <h4 className="font-semibold mb-4 text-secondary">BusinessHub.cy Group</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              {hubLinks.map((hub) => (
                <li key={hub.href}>
                  <Link
                    to={hub.href}
                    className="flex items-center gap-2 hover:text-secondary transition-colors"
                  >
                    <hub.brand.icon className="h-4 w-4 text-secondary" />
                    <span>{hub.brand.name}{hub.brand.domain}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-secondary">Contact</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-secondary" />
                <span>BusinessHub Ltd</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary" />
                <span>Nicosia, Cyprus</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary" />
                <a href={`mailto:info@${brand.name.toLowerCase()}.cy`} className="hover:text-secondary transition-colors">
                  info@{brand.name.toLowerCase()}.cy
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary" />
                <span>+357 22 123 456</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-navy-light text-center text-sm text-primary-foreground/50">
          <p>
            © 2024 {brand.name}{brand.domain}. All rights reserved. | 
            <a href="#" className="hover:text-secondary"> Privacy Policy</a> | 
            <a href="#" className="hover:text-secondary"> Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
