import { Link } from "react-router-dom";
import { ExternalLink, Search, ShieldCheck, FileText, HelpCircle } from "lucide-react";

const REGISTRAR_SEARCH_URL = "https://efiling.drcor.mcit.gov.cy/DrcorPublic/SearchForm.aspx";
const REGISTRAR_SITE_URL = "https://www.companies.gov.cy/en/";
const CY_LOGIN_URL = "https://cge.cyprus.gov.cy/cyloginregistration/register";

/** "How to search Cyprus companies" guide shown on the directory landing page. */
export function CompanySearchGuide({ totalCompanies }: { totalCompanies: number }) {
  const total = totalCompanies > 0 ? `${(Math.floor(totalCompanies / 1000) * 1000).toLocaleString()}+` : "54,000+";
  const steps = [
    {
      Icon: Search,
      title: "1. Search the directory for free",
      body: (
        <>
          Type a company name, a trading or former name, or a registration number (for example <strong>HE 6771</strong>) in
          the search box above. We list {total} Cyprus companies. Each profile shows the registration number and date, company
          type, current status, main activity and city.
        </>
      ),
    },
    {
      Icon: ShieldCheck,
      title: "2. Check licences",
      body: (
        <>
          Profiles show licences from CySEC and the Central Bank of Cyprus, taken from their official registers. To see
          every firm with a current CySEC licence in one place, open the{" "}
          <Link to="/directory/cysec-licensed-firms" className="text-secondary font-medium hover:underline">CySEC-licensed firms list</Link>.
          To narrow the directory to banks, e-money and payment institutions, use the "CBC Supervised" filter.
        </>
      ),
    },
    {
      Icon: FileText,
      title: "3. Get official documents from the Registrar of Companies",
      body: (
        <>
          For official records, such as directors, shareholders, registered office, charges and filed documents, use the
          Department of Registrar of Companies and Intellectual Property. Searching its{" "}
          <a href={REGISTRAR_SEARCH_URL} target="_blank" rel="noopener noreferrer" className="text-secondary font-medium hover:underline">online register</a>{" "}
          by name or number is free. To open a company's full file ("Study File") you need a{" "}
          <a href={CY_LOGIN_URL} target="_blank" rel="noopener noreferrer" className="text-secondary font-medium hover:underline">Government e-Services (CY Login) account</a>{" "}
          and pay a fee for each company, by card. Check the current fee on the Registrar's site.
        </>
      ),
    },
  ];

  const faqs = [
    {
      q: "What does the HE in a Cyprus registration number mean?",
      a: "Limited companies registered in Cyprus get a number with the prefix HE (ΗΕ in Greek), for example HE 6771. You can search our directory with or without the prefix.",
    },
    {
      q: "What does \"Reminder Letter Sent\" mean on a company's status?",
      a: "It means the Registrar has written to the company, usually about overdue filings. This can be an early step towards striking the company off the register. Only the company's official file at the Registrar shows the details.",
    },
    {
      q: "Is BusinessHub.cy the official register?",
      a: "No. BusinessHub.cy is an independent directory that makes Cyprus companies easier to find and links them to licences and news. For legal purposes, such as due diligence or court filings, rely on the Registrar of Companies' own records.",
    },
    {
      q: "Can I find who owns a Cyprus company?",
      a: "Shareholders and directors are part of a company's official file at the Registrar of Companies. Beneficial owners are recorded in a separate register run by the Registrar, and access to it is restricted.",
    },
  ];

  return (
    <section aria-labelledby="company-search-guide" className="mt-14 border-t border-border pt-10">
      <h2 id="company-search-guide" className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
        How to search for a company in Cyprus
      </h2>
      <p className="text-muted-foreground max-w-3xl mb-8 leading-relaxed">
        You can do a quick check here for free in seconds. For an official extract, go to the Registrar of Companies. Here's how
        each works.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {steps.map(({ Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-5">
            <Icon className="h-6 w-6 text-secondary mb-3" />
            <h3 className="font-serif font-bold text-lg text-foreground mb-2">{title}</h3>
            <p className="text-sm text-foreground/85 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-secondary" /> Common questions
      </h2>
      <div className="grid md:grid-cols-2 gap-x-10 gap-y-6 mb-8">
        {faqs.map((f) => (
          <div key={f.q}>
            <h3 className="font-semibold text-foreground mb-1.5">{f.q}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <a href={REGISTRAR_SITE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-secondary font-medium hover:underline">
          Registrar of Companies (official site) <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <a href={REGISTRAR_SEARCH_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-secondary font-medium hover:underline">
          Registrar online search <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}
