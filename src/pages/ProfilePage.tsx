import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  BadgeCheck, 
  Building2, 
  Mail, 
  Linkedin, 
  Calendar, 
  Users, 
  Newspaper, 
  Briefcase,
  GraduationCap,
  TrendingUp,
  ExternalLink,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfileById } from "@/data/profilesData";
import { getArticlesForPerson, getCoMentioned } from "@/data/knowledgeGraph";
import { ProfileConnectionCard } from "@/components/profile/ProfileConnectionCard";
import { ProfileNewsCard } from "@/components/profile/ProfileNewsCard";
import { ProfileTimeline } from "@/components/profile/ProfileTimeline";
import { BusinessTicker } from "@/components/BusinessTicker";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { InsightBanner } from "@/components/banners/InsightBanner";

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const profile = getProfileById(id || "");

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Profile Not Found</h1>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BusinessTicker />
      <TopNavigation onSearch={() => {}} />
      
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
        <img
          src={profile.coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Link to="/">
            <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-16 md:-mt-20 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profile.image}
                alt={profile.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-xl object-cover ring-4 ring-background shadow-lg"
              />
              {profile.verified && (
                <div className="absolute -bottom-2 -right-2 bg-secondary text-secondary-foreground p-2 rounded-full">
                  <BadgeCheck className="h-5 w-5" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 pt-4 md:pt-8">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">{profile.name}</h1>
                {profile.trending && (
                  <Badge className="bg-secondary/20 text-secondary border border-secondary/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Briefcase className="h-4 w-4" />
                <span className="font-medium">{profile.title}</span>
                <span className="text-muted">at</span>
                <span className="font-medium text-primary">{profile.company}</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.badges.map((badge) => (
                  <span key={badge} className="badge-cysec">
                    <BadgeCheck className="h-3 w-3" />
                    {badge}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-secondary" />
                  <span className="font-semibold text-primary">{profile.stats.connections}</span>
                  <span className="text-muted-foreground">Connections</span>
                </div>
                <div className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-secondary" />
                  <span className="font-semibold text-primary">{profile.stats.articles}</span>
                  <span className="text-muted-foreground">Articles</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-secondary" />
                  <span className="font-semibold text-primary">{profile.stats.yearsExperience}+</span>
                  <span className="text-muted-foreground">Years Experience</span>
                </div>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Mail className="mr-2 h-4 w-4" />
                Contact
              </Button>
              <Button variant="outline">
                <Linkedin className="mr-2 h-4 w-4" />
                Connect
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="about" className="mb-12">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-8">
            <TabsTrigger 
              value="about" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent px-6 py-3"
            >
              About
            </TabsTrigger>
            <TabsTrigger 
              value="career" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent px-6 py-3"
            >
              Career History
            </TabsTrigger>
            <TabsTrigger 
              value="network" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent px-6 py-3"
            >
              Network
            </TabsTrigger>
            <TabsTrigger 
              value="news" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent px-6 py-3"
            >
              Related News
            </TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="animate-fade-in">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Bio */}
              <div className="lg:col-span-2">
                <Card className="bento-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-secondary" />
                      Biography
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                  </CardContent>
                </Card>

                {/* Expertise */}
                <Card className="bento-card mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-secondary" />
                      Areas of Expertise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.expertise.map((skill) => (
                        <Badge key={skill} variant="secondary" className="bg-muted text-muted-foreground">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Education */}
                <Card className="bento-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-secondary" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.education.map((edu, index) => (
                      <div key={index} className="border-l-2 border-secondary/30 pl-4">
                        <p className="font-medium text-primary text-sm">{edu.degree}</p>
                        <p className="text-muted-foreground text-sm">{edu.institution}</p>
                        <p className="text-muted-foreground text-xs">{edu.year}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <Card className="bento-card-highlight">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5 text-secondary" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <a 
                      href={`mailto:${profile.contact.email}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      {profile.contact.email}
                    </a>
                    <a 
                      href={`https://${profile.contact.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>

                {/* Contextual Insight Banner */}
                <InsightBanner
                  text="Compliance obligations typically apply to firms operating in this sector. Explore how regulated entities manage AML, KYB, and reporting requirements."
                  ctaText="View compliance approach"
                  href="/compliance"
                  variant="default"
                />
              </div>
            </div>
          </TabsContent>

          {/* Career History Tab */}
          <TabsContent value="career" className="animate-fade-in">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-secondary" />
                  Professional Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileTimeline history={profile.companyHistory} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="animate-fade-in">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-primary mb-2">Professional Network</h3>
              <p className="text-muted-foreground text-sm">Key connections and collaborators</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.connections.map((connection) => (
                <ProfileConnectionCard key={connection.id} connection={connection} />
              ))}
            </div>
          </TabsContent>

          {/* Related News Tab */}
          <TabsContent value="news" className="animate-fade-in">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-primary mb-2">Recent News & Mentions</h3>
              <p className="text-muted-foreground text-sm">Articles featuring or related to {profile.name}</p>
            </div>

            {/* Knowledge Graph connections */}
            {(() => {
              const graphArticles = getArticlesForPerson(profile.id);
              const coMentioned = getCoMentioned(profile.id);
              return (
                <>
                  {coMentioned.length > 0 && (
                    <div className="mb-6 p-4 rounded-xl border border-secondary/20 bg-secondary/5">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-secondary">Knowledge Graph:</span>{" "}
                        {profile.name} is co-mentioned with{" "}
                        {coMentioned.map((cm, i) => (
                          <span key={cm.person.id}>
                            <Link to={`/profile/${cm.person.id}`} className="font-medium text-foreground hover:text-secondary transition-colors">
                              {cm.person.name}
                            </Link>
                            {" "}({cm.sharedArticles} shared articles)
                            {i < coMentioned.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-6">
                    {graphArticles.length > 0
                      ? graphArticles.map((article) => (
                          <ProfileNewsCard
                            key={article.id}
                            article={{
                              id: article.id,
                              title: article.title,
                              summary: article.summary,
                              date: article.date,
                              category: article.category,
                              image: article.image,
                            }}
                          />
                        ))
                      : profile.relatedNews.map((article) => (
                          <ProfileNewsCard key={article.id} article={article} />
                        ))}
                  </div>
                </>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;
