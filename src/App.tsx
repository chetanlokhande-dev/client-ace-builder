import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import History from "./pages/History.tsx";
import Profile from "./pages/Profile.tsx";
import Community from "./pages/Community.tsx";
import Communities from "./pages/Communities.tsx";
import CommunityDetail from "./pages/CommunityDetail.tsx";
import Saved from "./pages/Saved.tsx";
import SharedPitch from "./pages/SharedPitch.tsx";
import TempPitch from "./pages/TempPitch.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import Contact from "./pages/Contact.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import RouteTransition from "./components/pitchforge/RouteTransition";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RouteTransition>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/community" element={<Community />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/communities/:id" element={<CommunityDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/p/:token" element={<SharedPitch />} />
            <Route path="/t/:token" element={<TempPitch />} />
            <Route path="/u/:userId" element={<UserProfile />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </RouteTransition>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
