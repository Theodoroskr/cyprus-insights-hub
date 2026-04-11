import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ProfilePage from "./pages/ProfilePage";
import FinTechPage from "./pages/FinTechPage";
import CompliancePage from "./pages/CompliancePage";
import ResourcesPage from "./pages/ResourcesPage";
import DirectoryPage from "./pages/DirectoryPage";
import SMEPage from "./pages/SMEPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/fintech" element={<FinTechPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/sme" element={<SMEPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
