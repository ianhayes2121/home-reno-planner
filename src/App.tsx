
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProjectProvider, useProject } from "./contexts/ProjectContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import WelcomePage from "./components/WelcomePage";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Materials from "./pages/Materials";
import Tasks from "./pages/Tasks";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

// Wrapper component that redirects to welcome page if no project exists and user is authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { project } = useProject();
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" state={{ from: window.location.pathname }} replace />;
  }
  
  if (!project) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Wrapper component that redirects to dashboard if project exists
const WelcomeRoute = ({ children }: { children: React.ReactNode }) => {
  const { project } = useProject();
  const { loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (project) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route 
                path="/" 
                element={
                  <WelcomeRoute>
                    <WelcomePage />
                  </WelcomeRoute>
                } 
              />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/rooms" 
                element={
                  <ProtectedRoute>
                    <Rooms />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/materials" 
                element={
                  <ProtectedRoute>
                    <Materials />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tasks" 
                element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/schedule" 
                element={
                  <ProtectedRoute>
                    <Schedule />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
