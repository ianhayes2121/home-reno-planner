
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Clipboard,
  ClipboardCheck, 
  Home, 
  Square, 
  ListTodo,
  Calendar,
  Settings,
  LogOut,
  User
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { project, getCompletionPercentage } = useProject();
  const { user, profile, signOut } = useAuth();
  
  const completionPercentage = getCompletionPercentage();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Rooms", href: "/rooms", icon: Square },
    { name: "Materials", href: "/materials", icon: Clipboard },
    { name: "Tasks", href: "/tasks", icon: ListTodo },
    { name: "Schedule", href: "/schedule", icon: Calendar },
    { name: "Settings", href: "/settings", icon: Settings },
  ];
  
  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = () => {
    if (!profile) return 'U';
    
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    
    if (!firstName && !lastName) {
      return user?.email?.substring(0, 1).toUpperCase() || 'U';
    }
    
    return `${firstName.substring(0, 1)}${lastName.substring(0, 1)}`.toUpperCase();
  };

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
        
        {/* User profile section */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-between p-2">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm text-left">
                    <p className="font-medium truncate max-w-[120px]">
                      {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : user?.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.email}</p>
                  </div>
                </div>
                <User className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
