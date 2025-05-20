import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProject } from "@/contexts/ProjectContext";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckSquare, Clock, DollarSign } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { formatCurrency } from "@/lib/utils";

const Dashboard: React.FC = () => {
  const { project, getCompletionPercentage, getTotalMaterialCost } = useProject();
  
  if (!project) {
    return null; // This will be handled by App.tsx to redirect to welcome page
  }
  
  const completionPercentage = getCompletionPercentage();
  const materialCost = getTotalMaterialCost();
  
  const completedTasks = project.tasks.filter(task => task.status === "completed").length;
  const inProgressTasks = project.tasks.filter(task => task.status === "in-progress").length;
  const notStartedTasks = project.tasks.filter(task => task.status === "not-started").length;
  
  // Calculate budget utilization percentage
  const budgetUtilizationPercentage = Math.min(
    Math.round((materialCost / project.budget) * 100),
    100
  );
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{project.name} Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your basement renovation progress</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <CheckSquare className="mr-2 h-5 w-5 text-blue-500" />
              Project Progress
            </CardTitle>
            <CardDescription>Overall task completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{completionPercentage}%</div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="text-sm text-gray-500 mt-2">
              {completedTasks} of {project.tasks.length} tasks completed
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-green-500" />
              Budget
            </CardTitle>
            <CardDescription>Material costs vs. budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              ${formatCurrency(materialCost)}
              <span className="text-sm text-gray-500 font-normal ml-1">
                of ${formatCurrency(project.budget)}
              </span>
            </div>
            <Progress 
              value={budgetUtilizationPercentage} 
              className={`h-2 ${budgetUtilizationPercentage > 90 ? "bg-red-500" : ""}`} 
            />
            <div className="text-sm text-gray-500 mt-2">
              {budgetUtilizationPercentage}% of budget utilized
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Clock className="mr-2 h-5 w-5 text-purple-500" />
              Tasks Status
            </CardTitle>
            <CardDescription>Current project tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Completed</span>
                <span className="font-medium">{completedTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">In Progress</span>
                <span className="font-medium">{inProgressTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Not Started</span>
                <span className="font-medium">{notStartedTasks}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Rooms Overview</CardTitle>
            <CardDescription>
              {project.rooms.length} room{project.rooms.length === 1 ? "" : "s"} added to the project
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {project.rooms.length > 0 ? (
              <div className="space-y-3">
                {project.rooms.slice(0, 3).map(room => (
                  <div key={room.id} className="flex justify-between">
                    <span className="font-medium">{room.name}</span>
                    <span className="text-gray-500">
                      {room.length}' x {room.width}' x {room.height}'
                    </span>
                  </div>
                ))}
                {project.rooms.length > 3 && (
                  <div className="text-sm text-gray-500">
                    +{project.rooms.length - 3} more rooms
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                No rooms added yet. Add your first room to get started.
              </div>
            )}
          </CardContent>
          <div className="px-6 py-3 border-t border-gray-100">
            <Link
              to="/rooms"
              className={`${buttonVariants({ variant: "link" })} p-0 h-auto text-basement-blue-600`}
            >
              View all rooms <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Tasks</CardTitle>
            <CardDescription>
              Latest tasks in your project
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {project.tasks.length > 0 ? (
              <div className="space-y-3">
                {project.tasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex justify-between">
                    <span className="font-medium">{task.title}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      task.status === "completed" 
                        ? "bg-green-100 text-green-800" 
                        : task.status === "in-progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}>
                      {task.status === "completed" 
                        ? "Completed" 
                        : task.status === "in-progress"
                          ? "In Progress"
                          : "Not Started"}
                    </span>
                  </div>
                ))}
                {project.tasks.length > 3 && (
                  <div className="text-sm text-gray-500">
                    +{project.tasks.length - 3} more tasks
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                No tasks added yet. Create tasks to track your progress.
              </div>
            )}
          </CardContent>
          <div className="px-6 py-3 border-t border-gray-100">
            <Link
              to="/tasks"
              className={`${buttonVariants({ variant: "link" })} p-0 h-auto text-basement-blue-600`}
            >
              View all tasks <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
