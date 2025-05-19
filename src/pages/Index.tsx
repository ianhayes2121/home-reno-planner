
import React from "react";
import WelcomePage from "@/components/WelcomePage";
import { useProject } from "@/contexts/ProjectContext";
import Dashboard from "./Dashboard";

const Index = () => {
  const { project } = useProject();
  
  // If a project exists, show the dashboard, otherwise show the welcome page
  if (project) {
    return <Dashboard />;
  }
  
  return <WelcomePage />;
};

export default Index;
