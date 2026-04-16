import { lazy, Suspense } from "react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsent } from "./components/CookieConsent";

// Lazy-loaded route components
const Index = lazy(() => import("./pages/Index"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const FinTechPage = lazy(() => import("./pages/FinTechPage"));
const CompliancePage = lazy(() => import("./pages/CompliancePage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const DirectoryPage = lazy(() => import("./pages/DirectoryPage"));
const SMEPage = lazy(() => import("./pages/SMEPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const EditorialDashboard = lazy(() => import("./pages/EditorialDashboard"));
const ContentSourcesPage = lazy(() => import("./pages/ContentSourcesPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
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
const SponsoredArticlePage = lazy(() => import("./pages/SponsoredArticlePage"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const RegistryDirectoryPage = lazy(() => import("./pages/RegistryDirectoryPage"));
const RegistryCityPage = lazy(() => import("./pages/RegistryCityPage"));
const RegistryCompanyPage = lazy(() => import("./pages/RegistryCompanyPage"));
const RegTechPage = lazy(() => import("./pages/RegTechPage"));
const KYBSuccessPage = lazy(() => import("./pages/KYBSuccessPage"));
const KYBCancelledPage = lazy(() => import("./pages/KYBCancelledPage"));
const UserManagementPage = lazy(() => import("./pages/UserManagementPage"));

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
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/profile/:id" element={<ProfilePage />} />
                  <Route path="/fintech" element={<FinTechPage />} />
                  <Route path="/compliance" element={<CompliancePage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route path="/sme" element={<SMEPage />} />
                  <Route path="/regtech" element={<RegTechPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/editorial" element={<EditorialDashboard />} />
                  <Route path="/admin/sources" element={<ContentSourcesPage />} />
                  <Route path="/article/:id" element={<ArticlePage />} />
                  <Route path="/trade" element={<TradePage />} />

                  {/* Company Directory (55K+ companies) */}
                  <Route path="/directory" element={<RegistryDirectoryPage />} />
                  <Route path="/directory/city/:citySlug" element={<RegistryCityPage />} />
                  <Route path="/directory/company/:slug" element={<RegistryCompanyPage />} />
                  {/* Legacy UUID fallback */}
                  <Route path="/directory/:companyId" element={<RegistryCompanyPage />} />

                  {/* Intelligence Directory routes */}
                  <Route path="/companies/:slug" element={<CompanyProfilePage />} />
                  <Route path="/people/:slug" element={<PeopleProfilePage />} />
                  <Route path="/whoiswho" element={<WhoIsWhoPage />} />
                  <Route path="/whoiswho/:slug" element={<WhoIsWhoProfilePage />} />
                  <Route path="/news" element={<NewsListPage />} />
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
