import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto prose prose-lg text-foreground">
          <h1 className="text-3xl font-serif font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

          <h2 className="text-xl font-semibold mt-8 mb-3">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            By accessing and using BusinessHub.cy, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            BusinessHub.cy provides business intelligence, company directory information, regulatory compliance tools, trade data analytics, and editorial content focused on the Cyprus business ecosystem.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">3. User Accounts</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the confidentiality of your credentials.</li>
            <li>You must be at least 18 years old to create an account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">4. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            All content on BusinessHub.cy, including text, graphics, logos, data compilations, and software, is the property of BusinessHub Ltd or its content suppliers and is protected by Cyprus and international copyright laws. Unauthorised reproduction is prohibited.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">5. Acceptable Use</h2>
          <p className="text-muted-foreground leading-relaxed mb-2">You agree not to:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
            <li>Use the platform for unlawful purposes</li>
            <li>Scrape, crawl, or extract data without written permission</li>
            <li>Interfere with or disrupt the service</li>
            <li>Impersonate another person or entity</li>
            <li>Redistribute or resell content without authorisation</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">6. Premium Services</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Certain features may require a paid subscription. Payment terms, refund policies, and subscription details will be provided at the time of purchase. We reserve the right to modify pricing with reasonable notice.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">7. Disclaimer</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The information provided on BusinessHub.cy is for general informational purposes only. We make no warranties regarding the accuracy, completeness, or reliability of any content. This platform does not constitute legal, financial, or professional advice.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">8. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            To the maximum extent permitted by law, BusinessHub Ltd shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">9. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            These terms shall be governed by and construed in accordance with the laws of the Republic of Cyprus. Any disputes shall be subject to the exclusive jurisdiction of the courts of Cyprus.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">10. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">11. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about these terms, contact us at{" "}
            <a href="mailto:legal@businesshub.cy" className="text-secondary hover:underline">legal@businesshub.cy</a>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
