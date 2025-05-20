
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { Project, Room, Task, Material } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface ProjectContextType {
  project: Project | null;
  createProject: (name: string, budget: number) => Promise<void>;
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
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load project when user changes
  useEffect(() => {
    const loadProject = async () => {
      if (!user) {
        setProject(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // First, get the user's memberships directly (with the corrected RLS policy)
        const { data: projectUsers, error: projectUsersError } = await supabase
          .from('project_users')
          .select('project_id')
          .eq('user_id', user.id);
        
        if (projectUsersError) {
          console.error('Error fetching project users:', projectUsersError);
          throw projectUsersError;
        }
        
        if (projectUsers && projectUsers.length > 0) {
          // Get the first project (in a real app, you might want to let users choose)
          const projectId = projectUsers[0].project_id;
          
          // Now fetch the project details
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
          
          if (projectError) {
            console.error('Error fetching project:', projectError);
            throw projectError;
          }
          
          // Fetch rooms for this project
          const { data: rooms, error: roomsError } = await supabase
            .from('rooms')
            .select('*')
            .eq('project_id', projectId);
          
          if (roomsError) {
            console.error('Error fetching rooms:', roomsError);
            throw roomsError;
          }
          
          // Fetch materials for this project
          const { data: materials, error: materialsError } = await supabase
            .from('materials')
            .select('*')
            .eq('project_id', projectId);
          
          if (materialsError) {
            console.error('Error fetching materials:', materialsError);
            throw materialsError;
          }
          
          // Fetch tasks for this project
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId);
          
          if (tasksError) {
            console.error('Error fetching tasks:', tasksError);
            throw tasksError;
          }
          
          // Format the data to match our application's structure
          const formattedProject: Project = {
            id: projectData.id,
            name: projectData.name,
            budget: projectData.budget,
            notes: projectData.notes || "",
            startDate: projectData.start_date || null,
            rooms: rooms ? rooms.map((room: any) => ({
              id: room.id,
              name: room.name,
              length: room.length,
              width: room.width,
              height: room.height,
              hasBulkhead: room.has_bulkhead,
              bulkheadLength: room.bulkhead_length
            })) : [],
            tasks: tasks ? tasks.map((task: any) => ({
              id: task.id,
              title: task.title,
              description: task.description || "",
              status: task.status,
              materialsNeeded: task.materials_needed || [],
              startDate: task.start_date || null,
              endDate: task.end_date || null,
              dependsOn: task.depends_on || [],
              duration: task.duration
            })) : [],
            materials: materials ? materials.map((material: any) => ({
              id: material.id,
              name: material.name,
              unit: material.unit,
              unitCost: material.unit_cost,
              quantity: material.quantity,
              totalCost: material.total_cost
            })) : []
          };
          
          setProject(formattedProject);
        } else {
          // No projects found for this user
          console.log('No projects found for user');
          setProject(null);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [user]);

  const createProject = async (name: string, budget: number) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a project.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Create a new project in Supabase
      const projectId = uuidv4();
      const { error: projectError } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          name,
          budget,
          notes: '',
          start_date: null
        });

      if (projectError) throw projectError;

      // Add the user to the project
      const { error: userError } = await supabase
        .from('project_users')
        .insert({
          project_id: projectId,
          user_id: user.id,
          role: 'owner'
        });

      if (userError) throw userError;

      // Set the project in state
      setProject({
        id: projectId,
        name,
        rooms: [],
        tasks: [],
        materials: [],
        startDate: null,
        budget,
        notes: "",
      });

      toast({
        title: 'Project Created',
        description: `${name} has been created successfully.`,
      });
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const addRoom = async (room: Omit<Room, "id">) => {
    if (!project || !user) return;
    
    try {
      const roomId = uuidv4();
      
      // Add to Supabase
      const { error } = await supabase
        .from('rooms')
        .insert({
          id: roomId,
          project_id: project.id,
          name: room.name,
          length: room.length,
          width: room.width,
          height: room.height,
          has_bulkhead: room.hasBulkhead,
          bulkhead_length: room.bulkheadLength
        });
      
      if (error) throw error;
      
      const newRoom = {
        ...room,
        id: roomId,
      };
      
      setProject({
        ...project,
        rooms: [...project.rooms, newRoom],
      });
      
      toast({
        title: 'Room Added',
        description: `${room.name} has been added to your project.`,
      });
    } catch (error: any) {
      console.error('Error adding room:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add room',
        variant: 'destructive'
      });
    }
  };

  const updateRoom = async (room: Room) => {
    if (!project) return;
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('rooms')
        .update({
          name: room.name,
          length: room.length,
          width: room.width,
          height: room.height,
          has_bulkhead: room.hasBulkhead,
          bulkhead_length: room.bulkheadLength
        })
        .eq('id', room.id);
      
      if (error) throw error;
      
      setProject({
        ...project,
        rooms: project.rooms.map(r => r.id === room.id ? room : r),
      });
    } catch (error: any) {
      console.error('Error updating room:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update room',
        variant: 'destructive'
      });
    }
  };

  const removeRoom = async (id: string) => {
    if (!project) return;
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProject({
        ...project,
        rooms: project.rooms.filter(r => r.id !== id),
      });
      
      toast({
        title: 'Room Removed',
        description: "The room has been removed from your project.",
      });
    } catch (error: any) {
      console.error('Error removing room:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove room',
        variant: 'destructive'
      });
    }
  };

  const addTask = async (task: Omit<Task, "id">) => {
    if (!project) return;
    
    try {
      const taskId = uuidv4();
      
      // Add to Supabase
      const { error } = await supabase
        .from('tasks')
        .insert({
          id: taskId,
          project_id: project.id,
          title: task.title,
          description: task.description,
          status: task.status,
          materials_needed: task.materialsNeeded,
          start_date: task.startDate,
          end_date: task.endDate,
          depends_on: task.dependsOn,
          duration: task.duration
        });
      
      if (error) throw error;
      
      const newTask = {
        ...task,
        id: taskId,
      };
      
      setProject({
        ...project,
        tasks: [...project.tasks, newTask],
      });
      
      toast({
        title: 'Task Added',
        description: `${task.title} has been added to your project.`,
      });
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add task',
        variant: 'destructive'
      });
    }
  };

  const updateTask = async (task: Task) => {
    if (!project) return;
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description,
          status: task.status,
          materials_needed: task.materialsNeeded,
          start_date: task.startDate,
          end_date: task.endDate,
          depends_on: task.dependsOn,
          duration: task.duration
        })
        .eq('id', task.id);
      
      if (error) throw error;
      
      setProject({
        ...project,
        tasks: project.tasks.map(t => t.id === task.id ? task : t),
      });
      
      toast({
        title: 'Task Updated',
        description: `${task.title} has been updated.`,
      });
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update task',
        variant: 'destructive'
      });
    }
  };

  const removeTask = async (id: string) => {
    if (!project) return;
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProject({
        ...project,
        tasks: project.tasks.filter(t => t.id !== id),
      });
      
      toast({
        title: 'Task Removed',
        description: "The task has been removed from your project.",
      });
    } catch (error: any) {
      console.error('Error removing task:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove task',
        variant: 'destructive'
      });
    }
  };

  const addMaterial = async (material: Omit<Material, "id" | "totalCost">) => {
    if (!project) return;
    
    try {
      const totalCost = material.quantity * material.unitCost;
      const materialId = uuidv4();
      
      // Add to Supabase
      const { error } = await supabase
        .from('materials')
        .insert({
          id: materialId,
          project_id: project.id,
          name: material.name,
          unit: material.unit,
          unit_cost: material.unitCost,
          quantity: material.quantity,
          total_cost: totalCost
        });
      
      if (error) throw error;
      
      const newMaterial = {
        ...material,
        id: materialId,
        totalCost,
      };
      
      setProject({
        ...project,
        materials: [...project.materials, newMaterial],
      });
      
      toast({
        title: 'Material Added',
        description: `${material.name} has been added to your materials list.`,
      });
    } catch (error: any) {
      console.error('Error adding material:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add material',
        variant: 'destructive'
      });
    }
  };

  const updateMaterial = async (material: Material) => {
    if (!project) return;
    
    try {
      // Recalculate total cost
      const updatedMaterial = {
        ...material,
        totalCost: material.quantity * material.unitCost,
      };
      
      // Update in Supabase
      const { error } = await supabase
        .from('materials')
        .update({
          name: material.name,
          unit: material.unit,
          unit_cost: material.unitCost,
          quantity: material.quantity,
          total_cost: updatedMaterial.totalCost
        })
        .eq('id', material.id);
      
      if (error) throw error;
      
      setProject({
        ...project,
        materials: project.materials.map(m => m.id === material.id ? updatedMaterial : m),
      });
    } catch (error: any) {
      console.error('Error updating material:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update material',
        variant: 'destructive'
      });
    }
  };

  const removeMaterial = async (id: string) => {
    if (!project) return;
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProject({
        ...project,
        materials: project.materials.filter(m => m.id !== id),
      });
      
      toast({
        title: 'Material Removed',
        description: "The material has been removed from your list.",
      });
    } catch (error: any) {
      console.error('Error removing material:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove material',
        variant: 'destructive'
      });
    }
  };

  const calculateMaterials = async () => {
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
    
    try {
      // Add the materials to Supabase
      for (const material of materials) {
        const { error } = await supabase
          .from('materials')
          .insert({
            id: material.id,
            project_id: project.id,
            name: material.name,
            unit: material.unit,
            unit_cost: material.unitCost,
            quantity: material.quantity,
            total_cost: material.totalCost
          });
          
        if (error) throw error;
      }
      
      // Update project with calculated materials
      setProject({
        ...project,
        materials: materials,
      });
      
      toast({
        title: 'Materials Calculated',
        description: 'Material quantities have been calculated based on your room dimensions.',
      });
    } catch (error: any) {
      console.error('Error calculating materials:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to calculate materials',
        variant: 'destructive'
      });
    }
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
    loading,
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
