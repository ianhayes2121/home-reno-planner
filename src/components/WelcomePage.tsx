
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useProject } from "@/contexts/ProjectContext";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Square, ListTodo } from "lucide-react";

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { createProject } = useProject();
  
  const [projectName, setProjectName] = useState("My Basement Renovation");
  const [budget, setBudget] = useState(10000);
  
  const handleCreateProject = () => {
    if (projectName.trim() === "") return;
    
    createProject(projectName, budget);
    navigate("/rooms");
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-basement-blue-800 mb-2">
            Basement Renovation Planner
          </h1>
          <p className="text-xl text-gray-600">
            Design, price, and manage your basement renovation project
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="rounded-full bg-basement-blue-100 w-12 h-12 flex items-center justify-center mb-2">
                <Square className="h-6 w-6 text-basement-blue-600" />
              </div>
              <CardTitle>Design Your Space</CardTitle>
              <CardDescription>
                Add rooms and specify dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Enter your basement's layout details and we'll help you plan the space efficiently.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="rounded-full bg-basement-blue-100 w-12 h-12 flex items-center justify-center mb-2">
                <ClipboardCheck className="h-6 w-6 text-basement-blue-600" />
              </div>
              <CardTitle>Calculate Materials</CardTitle>
              <CardDescription>
                Get accurate material quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                We'll calculate exactly how many 2x4s, drywall sheets, and other materials you'll need.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="rounded-full bg-basement-blue-100 w-12 h-12 flex items-center justify-center mb-2">
                <ListTodo className="h-6 w-6 text-basement-blue-600" />
              </div>
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                Manage tasks and schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Create a project timeline, track completion, and stay on budget throughout your renovation.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="w-full mb-8">
          <CardHeader>
            <CardTitle>Create Your Project</CardTitle>
            <CardDescription>
              Start by setting up your basement renovation project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Basement Renovation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleCreateProject} 
              className="bg-basement-blue-600 hover:bg-basement-blue-700"
            >
              Create Project
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default WelcomePage;
