import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import ProfilePage from "./pages/ProfilePage";
import FinTechPage from "./pages/FinTechPage";
import CompliancePage from "./pages/CompliancePage";
import ResourcesPage from "./pages/ResourcesPage";
import DirectoryPage from "./pages/DirectoryPage";
import SMEPage from "./pages/SMEPage";
import DashboardPage from "./pages/DashboardPage";
import EditorialDashboard from "./pages/EditorialDashboard";
import ContentSourcesPage from "./pages/ContentSourcesPage";
import NotFound from "./pages/NotFound";

// Intelligence Directory pages
import DirectoryHomePage from "./pages/DirectoryHomePage";
// CompanyDirectoryPage replaced by RegistryDirectoryPage (unified)
import CompanyProfilePage from "./pages/CompanyProfilePage";
import PeopleProfilePage from "./pages/PeopleProfilePage";
import WhoIsWhoPage from "./pages/WhoIsWhoPage";
import WhoIsWhoProfilePage from "./pages/WhoIsWhoProfilePage";
import NewsListPage from "./pages/NewsListPage";
import NewsArticlePage from "./pages/NewsArticlePage";
import InterviewsPage from "./pages/InterviewsPage";
import InterviewArticlePage from "./pages/InterviewArticlePage";
import SearchPage from "./pages/SearchPage";
import IndustryPage from "./pages/IndustryPage";
import ArticlePage from "./pages/ArticlePage";
import TradePage from "./pages/TradePage";
import SponsoredArticlePage from "./pages/SponsoredArticlePage";

// Registry Directory pages (55K+ companies)
import RegistryDirectoryPage from "./pages/RegistryDirectoryPage";
import RegistryCityPage from "./pages/RegistryCityPage";
import RegistryCompanyPage from "./pages/RegistryCompanyPage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Original routes */}
              <Route path="/" element={<Index />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/fintech" element={<FinTechPage />} />
              <Route path="/compliance" element={<CompliancePage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/sme" element={<SMEPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/editorial" element={<EditorialDashboard />} />
              <Route path="/admin/sources" element={<ContentSourcesPage />} />
              <Route path="/article/:id" element={<ArticlePage />} />
              <Route path="/trade" element={<TradePage />} />

              {/* Company Directory (55K+ companies) */}
              <Route path="/directory" element={<RegistryDirectoryPage />} />
              <Route path="/directory/city/:citySlug" element={<RegistryCityPage />} />
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

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
