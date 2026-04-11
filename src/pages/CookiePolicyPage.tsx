import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto prose prose-lg text-foreground">
          <h1 className="text-3xl font-serif font-bold mb-2">Cookie Policy</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

          <h2 className="text-xl font-semibold mt-8 mb-3">1. What Are Cookies</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your browsing experience.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">2. How We Use Cookies</h2>
          <p className="text-muted-foreground leading-relaxed mb-2">BusinessHub.cy uses cookies for the following purposes:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
            <li><strong>Essential cookies:</strong> Required for the site to function properly, including authentication and security.</li>
            <li><strong>Functional cookies:</strong> Remember your preferences such as language and display settings.</li>
            <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our site to improve content and performance.</li>
            <li><strong>Advertising cookies:</strong> Used to deliver relevant advertisements and measure campaign effectiveness.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">3. Third-Party Cookies</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. Third parties include analytics providers and advertising networks.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">4. Managing Cookies</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            You can control and manage cookies through your browser settings. Most browsers allow you to refuse or delete cookies. Please note that disabling cookies may affect the functionality of this site.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">5. Cookie Consent</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            When you first visit our site, a cookie consent banner will appear. By clicking "Accept All", you consent to all cookies. You may choose "Essential Only" to limit cookies to those necessary for the site to function.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">6. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">7. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about our use of cookies, please contact us at{" "}
            <a href="mailto:info@businesshub.cy" className="text-secondary hover:underline">info@businesshub.cy</a>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
