import { useState } from "react";
import { Link } from "react-router-dom";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeAdCard } from "@/components/banners/NativeAdCard";
import { getAllProfiles, type Profile } from "@/data/profilesData";
import {
  Search, ShieldCheck, Award, Briefcase, ArrowRight,
  TrendingUp, Users, FileText, MapPin,
} from "lucide-react";

const badgeConfig: Record<string, { label: string; color: string }> = {
  CySEC: { label: "CySEC", color: "bg-compliance/15 text-compliance border-compliance/30" },
  ICPAC: { label: "ICPAC", color: "bg-fintech/15 text-fintech border-fintech/30" },
  CBA: { label: "CBA", color: "bg-secondary/15 text-secondary border-secondary/30" },
  Government: { label: "Government", color: "bg-primary/15 text-primary-foreground border-primary/30" },
  Verified: { label: "Verified", color: "bg-success/15 text-success border-success/30" },
};

const filterOptions = ["All", "CySEC", "ICPAC", "CBA", "Government", "Trending"];

function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <Link
      to={`/profile/${profile.id}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-secondary/40 hover:shadow-lg transition-all duration-200"
    >
      {/* Cover strip */}
      <div className="h-20 relative overflow-hidden">
        <img
          src={profile.coverImage}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/80" />
      </div>

      {/* Avatar overlapping cover */}
      <div className="px-5 -mt-10 relative z-10">
        <div className="flex items-end gap-4">
          <img
            src={profile.image}
            alt={profile.name}
            className="w-16 h-16 rounded-xl object-cover border-2 border-card shadow-md"
          />
          <div className="pb-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-base leading-tight truncate">
                {profile.name}
              </h3>
              {profile.verified && (
                <ShieldCheck className="h-4 w-4 text-success shrink-0" />
              )}
              {profile.trending && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-secondary uppercase tracking-wider">
                  <TrendingUp className="h-3 w-3" /> Trending
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-3 pb-4">
        <p className="text-sm text-muted-foreground leading-snug">
          <span className="font-medium text-foreground">{profile.title}</span>
          {" · "}
          {profile.company}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {profile.badges.map((badge) => {
            const config = badgeConfig[badge];
            if (!config) return null;
            return (
              <Badge
                key={badge}
                variant="outline"
                className={`text-[10px] px-2 py-0.5 font-medium ${config.color}`}
              >
                {badge === "Verified" && <ShieldCheck className="h-2.5 w-2.5 mr-1" />}
                {badge === "CySEC" && <Award className="h-2.5 w-2.5 mr-1" />}
                {config.label}
              </Badge>
            );
          })}
        </div>

        {/* Expertise chips */}
        <div className="flex flex-wrap gap-1 mt-3">
          {profile.expertise.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {skill}
            </span>
          ))}
          {profile.expertise.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              +{profile.expertise.length - 3}
            </span>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> {profile.stats.connections}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" /> {profile.stats.articles} articles
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3" /> {profile.stats.yearsExperience}y exp
          </span>
          <span className="ml-auto text-xs font-medium text-secondary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            View profile <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function DirectoryPage() {
  const allProfiles = getAllProfiles();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = allProfiles.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.company.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Trending" && p.trending) ||
      p.badges.includes(activeFilter);

    return matchesSearch && matchesFilter;
  });

  const handleSearch = (query: string) => setSearch(query);

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={handleSearch} />

      {/* Hero */}
      <section className="bg-primary py-14 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-3 font-playfair">
            WhoIsWho
          </h1>
          <p className="text-base md:text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-6">
            Verified Business Cards — The definitive directory of Cyprus's business, regulatory and financial leaders.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, or title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/95 border-border/50 h-11"
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-5 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {filterOptions.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeFilter === f
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "bg-transparent text-muted-foreground border-border hover:border-secondary/40 hover:text-foreground"
                }`}
              >
                {f === "Trending" && <TrendingUp className="h-3 w-3 inline mr-1" />}
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Profile Grid */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No profiles match your search.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((profile, index) => (
                <div key={profile.id}>
                  <ProfileCard profile={profile} />
                  {index === 1 && (
                    <div className="mt-5">
                      <NativeAdCard
                        title="Claim your Verified Business Card"
                        description="Register to manage your profile, add credentials, and connect with Cyprus's business community."
                        sponsor="BusinessHub.cy"
                        variant="compact"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Note */}
      <section className="py-6 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground text-center">
            Profiles are curated for informational purposes. Badges indicate verified professional affiliations.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
