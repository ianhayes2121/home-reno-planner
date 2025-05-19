
export type Material = {
  id: string;
  name: string;
  unit: string;
  unitCost: number;
  quantity: number;
  totalCost: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: "not-started" | "in-progress" | "completed";
  materialsNeeded: string[];
  startDate: string | null;
  endDate: string | null;
  dependsOn: string[];
  duration: number; // in days
};

export type Room = {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  hasBulkhead: boolean;
  bulkheadLength: number;
};

export type Project = {
  id: string;
  name: string;
  rooms: Room[];
  tasks: Task[];
  materials: Material[];
  startDate: string | null;
  budget: number;
  notes: string;
};
