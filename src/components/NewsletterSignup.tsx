import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const VERTICALS = [
  { id: "compliance", label: "Compliance & AML" },
  { id: "fintech", label: "FinTech & Digital Finance" },
  { id: "regtech", label: "RegTech & ICT Risk" },
  { id: "cyber", label: "Cyber & DORA" },
  { id: "sme", label: "SME & Entrepreneurship" },
  { id: "general", label: "General Business" },
];

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>(["general"]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const toggleVertical = (id: string) => {
    setSelectedVerticals((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: email.trim().toLowerCase(),
      name: name.trim() || null,
      company: company.trim() || null,
      job_title: jobTitle.trim() || null,
      verticals: selectedVerticals.length ? selectedVerticals : ["general"],
      frequency: "daily",
    });

    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast.info("You're already subscribed to our daily briefing.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      return;
    }

    setSubmitted(true);
    toast.success("Welcome! You'll receive your first briefing soon.");
  };

  if (submitted) {
    return (
      <section className="section-rule">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">You're In</h3>
            <p className="text-sm text-muted-foreground">
              Your daily intelligence briefing will arrive in your inbox each morning at 07:00 CET.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-rule">
      <div className="container mx-auto px-4 py-10">
        <div className="navy-gradient text-primary-foreground py-10 px-6 md:px-10">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-5 w-5 text-secondary" />
              <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-secondary">
                Daily Intelligence Briefing
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-bold mb-2">
              Get Cyprus Business Intelligence Delivered Daily
            </h2>
            <p className="text-primary-foreground/70 text-sm mb-6 max-w-lg">
              Curated for business professionals — compliance updates, fintech developments,
              trade data, and SME opportunities. Free, every morning.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Compact row: email + submit */}
              <div className="flex gap-2">
                <Input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 rounded-none flex-1"
                />
                {!expanded && (
                  <Button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-none text-xs uppercase tracking-wider font-semibold gap-1 shrink-0"
                  >
                    Subscribe
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Expanded details */}
              {expanded && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 rounded-none"
                    />
                    <Input
                      placeholder="Company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 rounded-none"
                    />
                    <Input
                      placeholder="Job title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 rounded-none"
                    />
                  </div>

                  {/* Vertical selection */}
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-secondary mb-3">
                      Select your interests
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {VERTICALS.map((v) => (
                        <label
                          key={v.id}
                          className={`flex items-center gap-2 p-2.5 border cursor-pointer transition-colors text-sm ${
                            selectedVerticals.includes(v.id)
                              ? "border-secondary bg-secondary/10 text-primary-foreground"
                              : "border-primary-foreground/20 text-primary-foreground/60 hover:border-primary-foreground/40"
                          }`}
                        >
                          <Checkbox
                            checked={selectedVerticals.includes(v.id)}
                            onCheckedChange={() => toggleVertical(v.id)}
                            className="border-primary-foreground/40 data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                          />
                          {v.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-none text-xs uppercase tracking-wider font-semibold gap-2"
                  >
                    {submitting ? "Subscribing…" : "Subscribe to Daily Briefing"}
                    {!submitting && <ArrowRight className="h-3.5 w-3.5" />}
                  </Button>

                  <p className="text-[10px] text-primary-foreground/40 text-center">
                    Free · Unsubscribe anytime · No spam, ever
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
