
import React, { useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { 
  Trash2, 
  Plus, 
  ListCheck, 
  Calendar,
  CheckSquare,
  Clock,
  AlertCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TaskItem: React.FC<{
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: "not-started" | "in-progress" | "completed") => void;
}> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const statusColors = {
    "not-started": "bg-gray-100 text-gray-800",
    "in-progress": "bg-blue-100 text-blue-800",
    "completed": "bg-green-100 text-green-800",
  };
  
  const statusLabels = {
    "not-started": "Not Started",
    "in-progress": "In Progress",
    "completed": "Completed",
  };
  
  const statusIcons = {
    "not-started": <AlertCircle className="h-4 w-4 mr-2" />,
    "in-progress": <Clock className="h-4 w-4 mr-2" />,
    "completed": <CheckSquare className="h-4 w-4 mr-2" />,
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
        
        <div className="flex justify-between items-center">
          <Select 
            value={task.status} 
            onValueChange={(value: "not-started" | "in-progress" | "completed") => 
              onStatusChange(task.id, value)
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
  
  const notStartedTasks = project?.tasks.filter(t => t.status === "not-started") || [];
  const inProgressTasks = project?.tasks.filter(t => t.status === "in-progress") || [];
  const completedTasks = project?.tasks.filter(t => t.status === "completed") || [];
  
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
              <AlertCircle className="mr-2 h-5 w-5 text-gray-500" /> Not Started ({notStartedTasks.length})
            </h2>
            <div className="space-y-4">
              {notStartedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleOpenDialog}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {notStartedTasks.length === 0 && (
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
              <Clock className="mr-2 h-5 w-5 text-blue-500" /> In Progress ({inProgressTasks.length})
            </h2>
            <div className="space-y-4">
              {inProgressTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleOpenDialog}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {inProgressTasks.length === 0 && (
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
              <CheckSquare className="mr-2 h-5 w-5 text-green-500" /> Completed ({completedTasks.length})
            </h2>
            <div className="space-y-4">
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleOpenDialog}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {completedTasks.length === 0 && (
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
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                />
              </div>
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
