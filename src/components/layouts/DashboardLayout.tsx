
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Clipboard,
  ClipboardCheck, 
  Home, 
  Square, 
  ListTodo,
  Calendar,
  Settings
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { project, getCompletionPercentage } = useProject();
  
  const completionPercentage = getCompletionPercentage();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Rooms", href: "/rooms", icon: Square },
    { name: "Materials", href: "/materials", icon: Clipboard },
    { name: "Tasks", href: "/tasks", icon: ListTodo },
    { name: "Schedule", href: "/schedule", icon: Calendar },
    { name: "Settings", href: "/settings", icon: Settings },
  ];
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-basement-blue-700">
            Basement Planner
          </h1>
          {project && (
            <div className="mt-2 text-sm text-gray-500">
              {project.name}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  isActive(item.href)
                    ? "bg-basement-blue-50 text-basement-blue-700"
                    : "text-gray-600 hover:bg-gray-100",
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md"
                )}
              >
                <item.icon
                  className={cn(
                    isActive(item.href)
                      ? "text-basement-blue-700"
                      : "text-gray-400 group-hover:text-gray-500",
                    "mr-3 flex-shrink-0 h-5 w-5"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Progress indicator */}
        {project && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Project Progress</span>
              <span className="text-sm text-gray-500">{completionPercentage}%</span>
            </div>
            <div className="bg-gray-200 h-2 rounded-full">
              <div 
                className="bg-basement-blue-500 h-2 rounded-full" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
