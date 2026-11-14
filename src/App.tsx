import { WhoIsWhoRoute } from "@/components/auth/WhoIsWhoGate";
import { lazy, Suspense } from "react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthReturn } from "@/components/auth/AuthReturn";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsent } from "./components/CookieConsent";
import { RouteSEODefaults } from "./components/RouteSEODefaults";

// Lazy-loaded route components
const Index = lazy(() => import("./pages/Index"));
const FinTechPage = lazy(() => import("./pages/FinTechPage"));
const EnergyPage = lazy(() => import("./pages/EnergyPage"));
const CompliancePage = lazy(() => import("./pages/CompliancePage"));
const ComplianceUpdatesPage = lazy(() => import("./pages/ComplianceUpdatesPage"));
const ComplianceItemPage = lazy(() => import("./pages/ComplianceItemPage"));
const ComplianceSanctionsPage = lazy(() => import("./pages/ComplianceSanctionsPage"));
const ComplianceDeadlinesPage = lazy(() => import("./pages/ComplianceDeadlinesPage"));
const ComplianceGuidancePage = lazy(() => import("./pages/ComplianceGuidancePage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const ResourceDetailPage = lazy(() => import("./pages/ResourceDetailPage"));
const DirectoryPage = lazy(() => import("./pages/DirectoryPage"));
const SMEPage = lazy(() => import("./pages/SMEPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const EditorialDashboard = lazy(() => import("./pages/EditorialDashboard"));
const ContentSourcesPage = lazy(() => import("./pages/ContentSourcesPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CompanyAnnouncementsPage = lazy(() => import("./pages/CompanyAnnouncementsPage"));
const CompanyAnnouncementPage = lazy(() => import("./pages/CompanyAnnouncementPage"));
const DirectoryHomePage = lazy(() => import("./pages/DirectoryHomePage"));
const CompanyProfilePage = lazy(() => import("./pages/CompanyProfilePage"));
const PeopleProfilePage = lazy(() => import("./pages/PeopleProfilePage"));
const WhoIsWhoPage = lazy(() => import("./pages/WhoIsWhoPage"));
const WhoIsWhoProfilePage = lazy(() => import("./pages/WhoIsWhoProfilePage"));
const NewsListPage = lazy(() => import("./pages/NewsListPage"));
const NewsArticlePage = lazy(() => import("./pages/NewsArticlePage"));
const InterviewsPage = lazy(() => import("./pages/InterviewsPage"));
const InterviewArticlePage = lazy(() => import("./pages/InterviewArticlePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const IndustryPage = lazy(() => import("./pages/IndustryPage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const TradePage = lazy(() => import("./pages/TradePage"));
const RealEstatePage = lazy(() => import("./pages/RealEstatePage"));
const TourismPage = lazy(() => import("./pages/TourismPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const ExploreDestinationPage = lazy(() => import("./pages/ExploreDestinationPage"));
const ExplorePlacePage = lazy(() => import("./pages/ExplorePlacePage"));
const ExploreNewsPage = lazy(() => import("./pages/ExploreNewsPage"));
const FundingPage = lazy(() => import("./pages/FundingPage"));
const FundingCallPage = lazy(() => import("./pages/FundingCallPage"));
const NicosiaCountrysidePage = lazy(() => import("./pages/NicosiaCountrysidePage"));
const ConferenceVenuesPage = lazy(() => import("./pages/ConferenceVenuesPage"));
const MyVenuesPage = lazy(() => import("./pages/MyVenuesPage"));
const EconomyPage = lazy(() => import("./pages/EconomyPage"));
const MastercardDemoPage = lazy(() => import("./pages/demo/MastercardDemoPage"));
const FinancialLiteracyPage = lazy(() => import("./pages/FinancialLiteracyPage"));
const FLObservatoryPage = lazy(() => import("./pages/finlit/FinLitModules").then((m) => ({ default: m.ObservatoryPage })));
const FLHouseholdPage = lazy(() => import("./pages/finlit/FinLitModules").then((m) => ({ default: m.HouseholdPage })));
const FLCostOfLivingPage = lazy(() => import("./pages/finlit/FinLitModules").then((m) => ({ default: m.CostOfLivingPage })));
const FLCreditPage = lazy(() => import("./pages/finlit/FinLitModules").then((m) => ({ default: m.CreditPage })));
const FLCalculatorsPage = lazy(() => import("./pages/finlit/FinLitModules").then((m) => ({ default: m.CalculatorsPage })));
const FLResearchPage = lazy(() => import("./pages/finlit/FinLitModules").then((m) => ({ default: m.ResearchPage })));
const FLCampaignsPage = lazy(() => import("./pages/finlit/FinLitModules").then((m) => ({ default: m.CampaignsPage })));
const FLMethodologyPage = lazy(() => import("./pages/finlit/FinLitModules").then((m) => ({ default: m.MethodologyPage })));
const AcademyPage = lazy(() => import("./pages/academy/AcademyPage"));
const AcademyProgrammePage = lazy(() => import("./pages/academy/ProgrammePage"));
const AcademyLessonPage = lazy(() => import("./pages/academy/LessonPage"));
const MastercardIntelligencePage = lazy(() => import("./pages/MastercardIntelligencePage"));
const SpendingPulsePage = lazy(() => import("./pages/SpendingPulsePage"));
const OpenDataPage = lazy(() => import("./pages/OpenDataPage"));
const SponsoredArticlePage = lazy(() => import("./pages/SponsoredArticlePage"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const RegistryDirectoryPage = lazy(() => import("./pages/RegistryDirectoryPage"));
const DirectoryAdminPage = lazy(() => import("./pages/DirectoryAdminPage"));
const RegistryCityPage = lazy(() => import("./pages/RegistryCityPage"));
const CysecLicensedFirmsPage = lazy(() => import("./pages/CysecLicensedFirmsPage"));
const RankingsPage = lazy(() => import("./pages/RankingsPage"));
const RegistryCompanyPage = lazy(() => import("./pages/RegistryCompanyPage"));
const RegTechPage = lazy(() => import("./pages/RegTechPage"));
const KYBSuccessPage = lazy(() => import("./pages/KYBSuccessPage"));
const KYBCancelledPage = lazy(() => import("./pages/KYBCancelledPage"));
const UserManagementPage = lazy(() => import("./pages/UserManagementPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
              <RouteSEODefaults />
              <Suspense fallback={<RouteLoader />}>
                <AuthReturn />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/profile/:id" element={<Navigate to="/whoiswho" replace />} />
                  <Route path="/fintech" element={<FinTechPage />} />
                  <Route path="/compliance" element={<CompliancePage />} />
                  <Route path="/compliance/regulatory-updates" element={<ComplianceUpdatesPage />} />
                  <Route path="/compliance/regulatory-updates/:slug" element={<ComplianceItemPage />} />
                  <Route path="/compliance/sanctions" element={<ComplianceSanctionsPage />} />
                  <Route path="/compliance/deadlines" element={<ComplianceDeadlinesPage />} />
                  <Route path="/compliance/guidance" element={<ComplianceGuidancePage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route path="/resources/:slug" element={<ResourceDetailPage />} />
                  <Route path="/sme" element={<SMEPage />} />
                  <Route path="/regtech" element={<RegTechPage />} />
                  <Route path="/energy" element={<EnergyPage />} />
                  <Route path="/energy/news" element={<EnergyPage archive />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/editorial" element={<EditorialDashboard />} />
                  <Route path="/admin/sources" element={<ContentSourcesPage />} />
                  <Route path="/admin/users" element={<UserManagementPage />} />
                  <Route path="/article/:id" element={<ArticlePage />} />
                  <Route path="/trade" element={<TradePage />} />
                  <Route path="/real-estate" element={<RealEstatePage />} />
                  <Route path="/tourism" element={<TourismPage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/explore/place/:slug" element={<ExplorePlacePage />} />
                  <Route path="/explore/news" element={<ExploreNewsPage />} />
                  <Route path="/explore/funding" element={<Navigate to="/funding?sector=tourism" replace />} />
                  <Route path="/funding" element={<FundingPage />} />
                  <Route path="/funding/:slug" element={<FundingCallPage />} />
                  <Route path="/explore/nicosia-countryside" element={<NicosiaCountrysidePage />} />
                  <Route path="/explore/conference-venues" element={<ConferenceVenuesPage />} />
                  <Route path="/explore/my-venues" element={<MyVenuesPage />} />
                  <Route path="/explore/:destination" element={<ExploreDestinationPage />} />
                  <Route path="/economy" element={<EconomyPage />} />
                  <Route path="/rankings" element={<RankingsPage />} />
                  <Route path="/demo/mastercard-financial-confidence" element={<MastercardDemoPage />} />
                  <Route path="/financial-literacy" element={<FinancialLiteracyPage />} />
                  <Route path="/financial-literacy/observatory" element={<FLObservatoryPage />} />
                  <Route path="/financial-literacy/household" element={<FLHouseholdPage />} />
                  <Route path="/financial-literacy/cost-of-living" element={<FLCostOfLivingPage />} />
                  <Route path="/financial-literacy/credit" element={<FLCreditPage />} />
                  <Route path="/financial-literacy/calculators" element={<FLCalculatorsPage />} />
                  <Route path="/financial-literacy/research" element={<FLResearchPage />} />
                  <Route path="/financial-literacy/campaigns" element={<FLCampaignsPage />} />
                  <Route path="/financial-literacy/methodology" element={<FLMethodologyPage />} />
                  <Route path="/financial-literacy/academy" element={<AcademyPage />} />
                  <Route path="/financial-literacy/academy/:programme" element={<AcademyProgrammePage />} />
                  <Route path="/financial-literacy/academy/:programme/:lesson" element={<AcademyLessonPage />} />
                  <Route path="/intelligence/mastercard" element={<MastercardIntelligencePage />} />
                  <Route path="/intelligence/mastercard/spendingpulse" element={<SpendingPulsePage />} />
                  <Route path="/open-data" element={<OpenDataPage />} />
                  <Route path="/real-estate/:district" element={<RealEstatePage />} />

                  {/* Company Directory (55K+ companies) */}
                  <Route path="/directory" element={<RegistryDirectoryPage />} />
                  <Route path="/directory/admin" element={<DirectoryAdminPage />} />
                  <Route path="/directory/city/:citySlug" element={<RegistryCityPage />} />
                  <Route path="/directory/cysec-licensed-firms" element={<CysecLicensedFirmsPage />} />
                  <Route path="/directory/company/:slug" element={<RegistryCompanyPage />} />
                  {/* Legacy UUID fallback */}
                  <Route path="/directory/:companyId" element={<RegistryCompanyPage />} />

                  {/* Intelligence Directory routes */}
                  <Route path="/companies/:slug" element={<CompanyProfilePage />} />
                  <Route path="/people/:slug" element={<WhoIsWhoRoute><PeopleProfilePage /></WhoIsWhoRoute>} />
                  <Route path="/whoiswho" element={<WhoIsWhoRoute><WhoIsWhoPage /></WhoIsWhoRoute>} />
                  <Route path="/whoiswho/:slug" element={<WhoIsWhoRoute><WhoIsWhoProfilePage /></WhoIsWhoRoute>} />
                  <Route path="/news" element={<NewsListPage />} />
                  <Route path="/company-announcements" element={<CompanyAnnouncementsPage />} />
                  <Route path="/company-announcements/:slug" element={<CompanyAnnouncementPage />} />
                  <Route path="/news/:slug" element={<NewsArticlePage />} />
                  <Route path="/interviews" element={<InterviewsPage />} />
                  <Route path="/interviews/:slug" element={<InterviewArticlePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/industries/:slug" element={<IndustryPage />} />
                  <Route path="/sponsored/:id" element={<SponsoredArticlePage />} />
                  <Route path="/kyb/success" element={<KYBSuccessPage />} />
                  <Route path="/kyb/cancelled" element={<KYBCancelledPage />} />
                  <Route path="/cookies" element={<CookiePolicyPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CookieConsent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
