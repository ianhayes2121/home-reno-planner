
import React, { createContext, useState, useContext, ReactNode } from "react";
import { Project, Room, Task, Material } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";

interface ProjectContextType {
  project: Project | null;
  createProject: (name: string, budget: number) => void;
  addRoom: (room: Omit<Room, "id">) => void;
  updateRoom: (room: Room) => void;
  removeRoom: (id: string) => void;
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (task: Task) => void;
  removeTask: (id: string) => void;
  addMaterial: (material: Omit<Material, "id" | "totalCost">) => void;
  updateMaterial: (material: Material) => void;
  removeMaterial: (id: string) => void;
  calculateMaterials: () => void;
  getCompletionPercentage: () => number;
  getTotalMaterialCost: () => number;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<Project | null>(null);

  const createProject = (name: string, budget: number) => {
    setProject({
      id: uuidv4(),
      name,
      rooms: [],
      tasks: [],
      materials: [],
      startDate: null,
      budget,
      notes: "",
    });
    toast({
      title: "Project Created",
      description: `${name} has been created successfully.`,
    });
  };

  const addRoom = (room: Omit<Room, "id">) => {
    if (!project) return;
    
    const newRoom = {
      ...room,
      id: uuidv4(),
    };
    
    setProject({
      ...project,
      rooms: [...project.rooms, newRoom],
    });
    
    toast({
      title: "Room Added",
      description: `${room.name} has been added to your project.`,
    });
  };

  const updateRoom = (room: Room) => {
    if (!project) return;
    
    setProject({
      ...project,
      rooms: project.rooms.map(r => r.id === room.id ? room : r),
    });
  };

  const removeRoom = (id: string) => {
    if (!project) return;
    
    setProject({
      ...project,
      rooms: project.rooms.filter(r => r.id !== id),
    });
    
    toast({
      title: "Room Removed",
      description: "The room has been removed from your project.",
    });
  };

  const addTask = (task: Omit<Task, "id">) => {
    if (!project) return;
    
    const newTask = {
      ...task,
      id: uuidv4(),
    };
    
    setProject({
      ...project,
      tasks: [...project.tasks, newTask],
    });
    
    toast({
      title: "Task Added",
      description: `${task.title} has been added to your project.`,
    });
  };

  const updateTask = (task: Task) => {
    if (!project) return;
    
    setProject({
      ...project,
      tasks: project.tasks.map(t => t.id === task.id ? task : t),
    });
    
    toast({
      title: "Task Updated",
      description: `${task.title} has been updated.`,
    });
  };

  const removeTask = (id: string) => {
    if (!project) return;
    
    setProject({
      ...project,
      tasks: project.tasks.filter(t => t.id !== id),
    });
    
    toast({
      title: "Task Removed",
      description: "The task has been removed from your project.",
    });
  };

  const addMaterial = (material: Omit<Material, "id" | "totalCost">) => {
    if (!project) return;
    
    const totalCost = material.quantity * material.unitCost;
    
    const newMaterial = {
      ...material,
      id: uuidv4(),
      totalCost,
    };
    
    setProject({
      ...project,
      materials: [...project.materials, newMaterial],
    });
    
    toast({
      title: "Material Added",
      description: `${material.name} has been added to your materials list.`,
    });
  };

  const updateMaterial = (material: Material) => {
    if (!project) return;
    
    // Recalculate total cost
    const updatedMaterial = {
      ...material,
      totalCost: material.quantity * material.unitCost,
    };
    
    setProject({
      ...project,
      materials: project.materials.map(m => m.id === material.id ? updatedMaterial : m),
    });
  };

  const removeMaterial = (id: string) => {
    if (!project) return;
    
    setProject({
      ...project,
      materials: project.materials.filter(m => m.id !== id),
    });
    
    toast({
      title: "Material Removed",
      description: "The material has been removed from your list.",
    });
  };

  const calculateMaterials = () => {
    if (!project) return;
    
    const materials: Material[] = [];
    
    // Basic calculations for common materials based on room dimensions
    project.rooms.forEach(room => {
      // Calculate wall framing materials (2x4s)
      const perimeter = 2 * (room.length + room.width);
      // Assume studs are placed 16" on center and each wall is room.height tall
      const studsNeeded = Math.ceil(perimeter * 12 / 16); // Convert to inches and divide by 16" spacing
      
      // Add 2x4s for top and bottom plates - 2 plates for each wall
      const platesNeeded = Math.ceil(perimeter / 8) * 2; // Assuming 8' 2x4s
      
      // Total 2x4s needed
      const total2x4sNeeded = studsNeeded + platesNeeded;
      
      // Add to materials if not already present
      const existing2x4 = materials.find(m => m.name === "2x4x8' Lumber");
      if (existing2x4) {
        existing2x4.quantity += total2x4sNeeded;
        existing2x4.totalCost = existing2x4.quantity * existing2x4.unitCost;
      } else {
        materials.push({
          id: uuidv4(),
          name: "2x4x8' Lumber",
          unit: "piece",
          unitCost: 5.98, // Default price, should be updated by user
          quantity: total2x4sNeeded,
          totalCost: total2x4sNeeded * 5.98,
        });
      }
      
      // Calculate drywall sheets (4'x8')
      const wallArea = perimeter * room.height;
      const dryWallSheetsNeeded = Math.ceil(wallArea / 32); // 4x8 = 32 sq ft per sheet
      
      const existingDrywall = materials.find(m => m.name === "Drywall 4'x8' Sheet");
      if (existingDrywall) {
        existingDrywall.quantity += dryWallSheetsNeeded;
        existingDrywall.totalCost = existingDrywall.quantity * existingDrywall.unitCost;
      } else {
        materials.push({
          id: uuidv4(),
          name: "Drywall 4'x8' Sheet",
          unit: "sheet",
          unitCost: 12.98, // Default price
          quantity: dryWallSheetsNeeded,
          totalCost: dryWallSheetsNeeded * 12.98,
        });
      }
      
      // Calculate insulation batts (assuming R-13 for 2x4 walls)
      const insulationPacksNeeded = Math.ceil(wallArea / 40); // Each pack covers ~40 sq ft
      
      const existingInsulation = materials.find(m => m.name === "R-13 Insulation Pack");
      if (existingInsulation) {
        existingInsulation.quantity += insulationPacksNeeded;
        existingInsulation.totalCost = existingInsulation.quantity * existingInsulation.unitCost;
      } else {
        materials.push({
          id: uuidv4(),
          name: "R-13 Insulation Pack",
          unit: "pack",
          unitCost: 45.97, // Default price
          quantity: insulationPacksNeeded,
          totalCost: insulationPacksNeeded * 45.97,
        });
      }
      
      // Calculate bulkhead materials if needed (2x2s)
      if (room.hasBulkhead) {
        // As per requirements: 6 2x2x8' pieces per 8' of bulkhead
        const bulkheadStudsNeeded = Math.ceil(room.bulkheadLength / 8 * 6);
        
        const existingBulkhead = materials.find(m => m.name === "2x2x8' Spruce");
        if (existingBulkhead) {
          existingBulkhead.quantity += bulkheadStudsNeeded;
          existingBulkhead.totalCost = existingBulkhead.quantity * existingBulkhead.unitCost;
        } else {
          materials.push({
            id: uuidv4(),
            name: "2x2x8' Spruce",
            unit: "piece",
            unitCost: 3.45, // Default price
            quantity: bulkheadStudsNeeded,
            totalCost: bulkheadStudsNeeded * 3.45,
          });
        }
      }
    });
    
    // Update project with calculated materials
    setProject({
      ...project,
      materials: materials,
    });
    
    toast({
      title: "Materials Calculated",
      description: "Material quantities have been calculated based on your room dimensions.",
    });
  };

  const getCompletionPercentage = (): number => {
    if (!project || project.tasks.length === 0) return 0;
    
    const completedTasks = project.tasks.filter(t => t.status === "completed").length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  };

  const getTotalMaterialCost = (): number => {
    if (!project) return 0;
    
    return project.materials.reduce((total, material) => total + material.totalCost, 0);
  };

  const value = {
    project,
    createProject,
    addRoom,
    updateRoom,
    removeRoom,
    addTask,
    updateTask,
    removeTask,
    addMaterial,
    updateMaterial,
    removeMaterial,
    calculateMaterials,
    getCompletionPercentage,
    getTotalMaterialCost,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
