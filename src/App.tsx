import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import SkipLink from "@/components/SkipLink";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import QuestPage from "./pages/QuestPage";
import Leaderboard from "./pages/Leaderboard";
import Analytics from "./pages/Analytics";
import Forum from "./pages/Forum";
import Challenges from "./pages/Challenges";
import AIMentor from "./pages/AIMentor";
import Profile from "./pages/Profile";
import Courses from "./pages/Courses";
import PythonCourse from "./pages/PythonCourse";
import MachineLearningCourse from "./pages/MachineLearningCourse";
import DataVisualizationCourse from "./pages/DataVisualizationCourse";
import SQLCourse from "./pages/SQLCourse";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SkipLink />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signin" element={<Auth mode="signin" />} />
              <Route path="/signup" element={<Auth mode="signup" />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/quest/:questId" element={<QuestPage />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/ai-mentor" element={<AIMentor />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/python" element={<PythonCourse />} />
              <Route path="/courses/data-visualization" element={<DataVisualizationCourse />} />
              <Route path="/courses/machine-learning" element={<MachineLearningCourse />} />
              <Route path="/courses/sql" element={<SQLCourse />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
