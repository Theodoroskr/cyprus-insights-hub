import { Building2, Mail, Phone, MapPin, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="navy-gradient text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <span className="font-bold text-lg text-secondary-foreground">B</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">BusinessHub<span className="text-secondary">.cy</span></h3>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/70 mb-4">
              Your comprehensive platform for Cyprus business intelligence, regulatory compliance, and EU funding opportunities.
            </p>
            <div className="flex gap-3">
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
              <li><a href="#" className="hover:text-secondary transition-colors">Latest News</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Business Directory</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">EU Funding</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Compliance Center</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Reports & Analysis</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-secondary">Resources</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="#" className="hover:text-secondary transition-colors">AML Guidelines</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">CySEC Regulations</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Tax Updates</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Investment Guide</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">API Documentation</a></li>
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
                <a href="mailto:info@businesshub.cy" className="hover:text-secondary transition-colors">
                  info@businesshub.cy
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
          <p>© 2024 BusinessHub.cy. All rights reserved. | <a href="#" className="hover:text-secondary">Privacy Policy</a> | <a href="#" className="hover:text-secondary">Terms of Service</a></p>
        </div>
      </div>
    </footer>
  );
}
