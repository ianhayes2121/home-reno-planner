
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProject } from "@/contexts/ProjectContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useToast } from "@/components/ui/use-toast";
import { Settings as SettingsIcon } from "lucide-react";

const Settings: React.FC = () => {
  const { project, createProject } = useProject();
  const { toast } = useToast();
  
  const [name, setName] = useState(project?.name || "");
  const [budget, setBudget] = useState(project?.budget || 0);
  const [notes, setNotes] = useState(project?.notes || "");
  
  const handleSave = () => {
    if (!project) return;
    
    // Since we don't have a dedicated update project function,
    // we'll create a new project with the updated values but same rooms, tasks, etc.
    createProject(name, budget);
    
    toast({
      title: "Settings Saved",
      description: "Your project settings have been updated.",
    });
  };
  
  const handleExport = () => {
    if (!project) return;
    
    const projectData = JSON.stringify(project, null, 2);
    const blob = new Blob([projectData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "_")}_project_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Project Exported",
      description: "Your project data has been exported as a JSON file.",
    });
  };
  
  if (!project) {
    return null;
  }
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your project settings</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              Update your project details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
            
            <div className="space-y-2">
              <Label htmlFor="notes">Project Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about your project..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
              />
            </div>
            
            <Button 
              onClick={handleSave}
              className="w-full bg-basement-blue-600 hover:bg-basement-blue-700"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Export your project data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Export your project data as a JSON file to back up your project or transfer it to another system.
            </p>
            
            <Button 
              onClick={handleExport}
              variant="outline"
              className="w-full"
            >
              Export Project Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
