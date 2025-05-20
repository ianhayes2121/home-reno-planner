
import React from "react";
import WelcomePage from "@/components/WelcomePage";
import { useProject } from "@/contexts/ProjectContext";
import Dashboard from "./Dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { project, loading: projectLoading } = useProject();
  const { user, loading: authLoading } = useAuth();
  
  // Show loading state while authentication or project data is loading
  if (authLoading || projectLoading) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-3xl space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-80 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  // If a project exists, show the dashboard, otherwise show the welcome page
  if (project) {
    return <Dashboard />;
  }
  
  return <WelcomePage />;
};

export default Index;
