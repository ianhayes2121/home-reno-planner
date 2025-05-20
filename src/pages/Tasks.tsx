
import React, { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProject } from "@/contexts/ProjectContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Material, Task } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { 
  Trash2, 
  Plus, 
  ListCheck, 
  Calendar,
  CheckSquare,
  Clock,
  AlertCircle,
  Link
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Define status labels at the component level so it's accessible throughout
const statusLabels = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "completed": "Completed",
};

const TaskItem: React.FC<{
  task: Task;
  allTasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: "not-started" | "in-progress" | "completed") => void;
}> = ({ task, allTasks, onEdit, onDelete, onStatusChange }) => {
  const { toast } = useToast();
  
  const statusColors = {
    "not-started": "bg-gray-100 text-gray-800",
    "in-progress": "bg-blue-100 text-blue-800",
    "completed": "bg-green-100 text-green-800",
  };
  
  const statusIcons = {
    "not-started": <AlertCircle className="h-4 w-4 mr-2" />,
    "in-progress": <Clock className="h-4 w-4 mr-2" />,
    "completed": <CheckSquare className="h-4 w-4 mr-2" />,
  };
  
  // Find dependent tasks based on the dependsOn array
  const dependencies = task.dependsOn?.map(depId => 
    allTasks.find(t => t.id === depId)
  ).filter(Boolean) || [];
  
  // Check if all dependencies are completed
  const allDependenciesCompleted = dependencies.every(dep => dep?.status === "completed");
  
  // Handle status change with validation for dependencies
  const handleStatusChange = (newStatus: "not-started" | "in-progress" | "completed") => {
    // If trying to set to in-progress but dependencies aren't completed
    if (newStatus === "in-progress" && !allDependenciesCompleted && dependencies.length > 0) {
      toast({
        title: "Dependencies not completed",
        description: "All dependent tasks must be completed before starting this task.",
        variant: "destructive",
      });
      return;
    }
    
    onStatusChange(task.id, newStatus);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription className="mt-1">
              {task.duration} day{task.duration !== 1 ? "s" : ""} 
              {task.startDate ? ` • Starts: ${new Date(task.startDate).toLocaleDateString()}` : ""}
              {task.endDate ? ` • Ends: ${new Date(task.endDate).toLocaleDateString()}` : ""}
            </CardDescription>
          </div>
          <div 
            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${statusColors[task.status]}`}
          >
            {statusIcons[task.status]} 
            {statusLabels[task.status]}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{task.description}</p>
        
        {/* Display dependencies */}
        {dependencies.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Link className="h-4 w-4 mr-1 text-gray-500" />
              <span className="text-sm font-medium">Dependencies:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {dependencies.map(dep => (
                dep && (
                  <Badge 
                    key={dep.id} 
                    variant="outline" 
                    className={dep.status === "completed" ? "border-green-500 text-green-700" : "border-amber-500 text-amber-700"}
                  >
                    {dep.title} 
                    {dep.status === "completed" ? 
                      <CheckSquare className="ml-1 h-3 w-3 text-green-500" /> : 
                      <Clock className="ml-1 h-3 w-3 text-amber-500" />
                    }
                  </Badge>
                )
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <Select 
            value={task.status} 
            onValueChange={(value: "not-started" | "in-progress" | "completed") => 
              handleStatusChange(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Tasks: React.FC = () => {
  const { project, addTask, updateTask, removeTask } = useProject();
  const { toast } = useToast();
  
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"not-started" | "in-progress" | "completed">("not-started");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [duration, setDuration] = useState(1);
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [materialsNeeded, setMaterialsNeeded] = useState<string[]>([]);
  
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("not-started");
    setStartDate("");
    setEndDate("");
    setDuration(1);
    setDependsOn([]);
    setMaterialsNeeded([]);
    setEditingTask(null);
  };
  
  // Calculate end date based on start date and duration
  const calculateEndDate = useCallback((start: string, durationDays: number) => {
    if (!start) return "";
    const startDateObj = new Date(start);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + durationDays);
    return endDateObj.toISOString().split('T')[0];
  }, []);
  
  // Handle start date change with validation for dependencies
  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    
    // Find all dependent tasks and their end dates
    if (dependsOn.length > 0 && project) {
      const dependentTasks = project.tasks.filter(t => dependsOn.includes(t.id));
      const latestEndDate = dependentTasks.reduce((latest, task) => {
        if (!task.endDate) return latest;
        return new Date(task.endDate) > new Date(latest) ? task.endDate : latest;
      }, "1970-01-01");
      
      // If selected start date is before the latest dependency end date, show warning
      if (latestEndDate && new Date(newStartDate) < new Date(latestEndDate)) {
        toast({
          title: "Warning",
          description: "This start date is before one or more dependencies finish.",
          variant: "default",
        });
      }
    }
    
    // Update end date based on new start date and duration
    if (newStartDate) {
      const newEndDate = calculateEndDate(newStartDate, duration);
      setEndDate(newEndDate);
    } else {
      setEndDate("");
    }
  };
  
  // Handle duration change and update end date
  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    if (startDate) {
      const newEndDate = calculateEndDate(startDate, newDuration);
      setEndDate(newEndDate);
    }
  };
  
  const handleOpenDialog = (task?: Task) => {
    if (task) {
      // Editing existing task
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setStartDate(task.startDate || "");
      setEndDate(task.endDate || "");
      setDuration(task.duration);
      setDependsOn(task.dependsOn);
      setMaterialsNeeded(task.materialsNeeded);
      setEditingTask(task);
    } else {
      // Adding new task
      resetForm();
    }
    setTaskDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setTaskDialogOpen(false);
    resetForm();
  };
  
  const handleSaveTask = () => {
    if (title.trim() === "" || duration <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate dependencies
    if (dependsOn.length > 0 && startDate && project) {
      const dependentTasks = project.tasks.filter(t => dependsOn.includes(t.id));
      
      // Check if any dependency doesn't have an end date
      const missingEndDates = dependentTasks.filter(t => !t.endDate);
      if (missingEndDates.length > 0) {
        toast({
          title: "Missing Information",
          description: "Some dependent tasks don't have end dates set.",
          variant: "default",
        });
      }
      
      // Check if start date is before any dependency's end date
      const invalidDates = dependentTasks.filter(t => 
        t.endDate && new Date(startDate) < new Date(t.endDate)
      );
      
      if (invalidDates.length > 0) {
        toast({
          title: "Date Conflict",
          description: "Start date is before one or more dependencies finish.",
          variant: "default",
        });
      }
    }
    
    const taskData = {
      title,
      description,
      status,
      startDate,
      endDate,
      duration,
      dependsOn,
      materialsNeeded,
    };
    
    if (editingTask) {
      updateTask({ ...taskData, id: editingTask.id });
    } else {
      addTask(taskData);
    }
    
    handleCloseDialog();
  };
  
  const handleDeleteTask = (id: string) => {
    removeTask(id);
  };
  
  const handleStatusChange = (id: string, newStatus: "not-started" | "in-progress" | "completed") => {
    const task = project?.tasks.find(t => t.id === id);
    if (task) {
      updateTask({ ...task, status: newStatus });
    }
  };
  
  // Sort tasks by start date (null dates at the bottom)
  const sortedTasks = useMemo(() => {
    if (!project) return { notStarted: [], inProgress: [], completed: [] };
    
    // Helper function to sort by start date
    const sortByStartDate = (tasks: Task[]) => {
      return [...tasks].sort((a, b) => {
        // If both have start dates, compare them
        if (a.startDate && b.startDate) {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }
        // If only a has a start date, it should come first
        if (a.startDate) return -1;
        // If only b has a start date, it should come first
        if (b.startDate) return 1;
        // If neither has a start date, maintain original order
        return 0;
      });
    };
    
    return {
      notStarted: sortByStartDate(project.tasks.filter(t => t.status === "not-started")),
      inProgress: sortByStartDate(project.tasks.filter(t => t.status === "in-progress")),
      completed: sortByStartDate(project.tasks.filter(t => t.status === "completed"))
    };
  }, [project]);
  
  if (!project) {
    return null;
  }
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">
            Manage and track renovation tasks
          </p>
        </div>
        
        <Button 
          onClick={() => handleOpenDialog()} 
          className="bg-basement-blue-600 hover:bg-basement-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>
      
      {project.tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-gray-500" /> Not Started ({sortedTasks.notStarted.length})
            </h2>
            <div className="space-y-4">
              {sortedTasks.notStarted.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  allTasks={project.tasks}
                  onEdit={handleOpenDialog}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {sortedTasks.notStarted.length === 0 && (
                <Card className="bg-gray-50 border-dashed">
                  <CardContent className="text-center py-6 text-gray-500">
                    No tasks in this column
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-500" /> In Progress ({sortedTasks.inProgress.length})
            </h2>
            <div className="space-y-4">
              {sortedTasks.inProgress.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  allTasks={project.tasks}
                  onEdit={handleOpenDialog}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {sortedTasks.inProgress.length === 0 && (
                <Card className="bg-gray-50 border-dashed">
                  <CardContent className="text-center py-6 text-gray-500">
                    No tasks in this column
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <CheckSquare className="mr-2 h-5 w-5 text-green-500" /> Completed ({sortedTasks.completed.length})
            </h2>
            <div className="space-y-4">
              {sortedTasks.completed.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  allTasks={project.tasks}
                  onEdit={handleOpenDialog}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {sortedTasks.completed.length === 0 && (
                <Card className="bg-gray-50 border-dashed">
                  <CardContent className="text-center py-6 text-gray-500">
                    No tasks in this column
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Card className="text-center p-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gray-100 p-4">
              <ListCheck className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Tasks Added Yet</h2>
          <p className="text-gray-500 mb-4">
            Start adding tasks to track your renovation progress.
          </p>
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-basement-blue-600 hover:bg-basement-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Your First Task
          </Button>
        </Card>
      )}
      
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Add New Task"}
            </DialogTitle>
            <DialogDescription>
              Enter the details of your renovation task.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="e.g., Frame Walls, Install Drywall"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Enter task details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Dependencies field */}
            <div className="space-y-2">
              <Label htmlFor="dependencies">Dependencies</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={`${dependsOn.length} task${dependsOn.length !== 1 ? 's' : ''} selected`} />
                </SelectTrigger>
                <SelectContent>
                  <div className="max-h-[200px] overflow-auto">
                    {project.tasks
                      .filter(t => t.id !== (editingTask?.id || 'new')) // Filter out self
                      .map(task => (
                        <div key={task.id} className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer">
                          <input
                            type="checkbox"
                            id={`task-${task.id}`}
                            checked={dependsOn.includes(task.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDependsOn([...dependsOn, task.id]);
                              } else {
                                setDependsOn(dependsOn.filter(id => id !== task.id));
                              }
                            }}
                            className="mr-2"
                          />
                          <label 
                            htmlFor={`task-${task.id}`}
                            className="flex-grow cursor-pointer"
                          >
                            {task.title}
                            <span className={`ml-2 text-xs ${
                              task.status === 'completed' ? 'text-green-500' : 
                              task.status === 'in-progress' ? 'text-blue-500' : 
                              'text-gray-500'
                            }`}>
                              ({statusLabels[task.status]})
                            </span>
                          </label>
                        </div>
                      ))
                    }
                    {project.tasks.length === (editingTask ? 1 : 0) && (
                      <div className="px-2 py-2 text-gray-500 text-sm">
                        No other tasks available
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
              {dependsOn.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {dependsOn.map(depId => {
                    const task = project.tasks.find(t => t.id === depId);
                    return task && (
                      <Badge 
                        key={depId} 
                        variant="outline"
                        className={task.status === "completed" ? "border-green-500 text-green-700" : "border-amber-500 text-amber-700"}
                      >
                        {task.title}
                        <button 
                          onClick={() => setDependsOn(dependsOn.filter(id => id !== depId))}
                          className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                        >
                          ✕
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: "not-started" | "in-progress" | "completed") => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            
            {/* Calculated End Date (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date (Calculated)</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask} className="bg-basement-blue-600 hover:bg-basement-blue-700">
              {editingTask ? "Update" : "Save"} Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Tasks;
