import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto prose prose-lg text-foreground">
          <h1 className="text-3xl font-serif font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

          <h2 className="text-xl font-semibold mt-8 mb-3">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            BusinessHub.cy ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">2. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed mb-2">We may collect the following types of information:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
            <li><strong>Personal data:</strong> Name, email address, company name, and job title when you register an account.</li>
            <li><strong>Usage data:</strong> Pages visited, time spent, browser type, device information, and IP address.</li>
            <li><strong>Cookies and tracking:</strong> See our <a href="/cookies" className="text-secondary hover:underline">Cookie Policy</a> for details.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
            <li>To provide and maintain our services</li>
            <li>To personalise your experience and deliver relevant content</li>
            <li>To communicate with you about updates, newsletters, and promotions</li>
            <li>To analyse usage trends and improve our platform</li>
            <li>To comply with legal obligations</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">4. Data Sharing</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We do not sell your personal data. We may share data with trusted third-party service providers who assist in operating our platform, subject to confidentiality agreements. We may also disclose data if required by law.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">5. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">6. Your Rights (GDPR)</h2>
          <p className="text-muted-foreground leading-relaxed mb-2">Under the General Data Protection Regulation, you have the right to:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
            <li>Access your personal data</li>
            <li>Rectify inaccurate data</li>
            <li>Request erasure of your data</li>
            <li>Restrict or object to processing</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">7. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We retain your personal data only for as long as necessary to fulfil the purposes outlined in this policy, unless a longer retention period is required by law.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">8. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy-related inquiries, please contact us at{" "}
            <a href="mailto:privacy@businesshub.cy" className="text-secondary hover:underline">privacy@businesshub.cy</a>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
