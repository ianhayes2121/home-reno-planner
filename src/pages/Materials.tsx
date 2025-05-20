import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Material } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Plus, ClipboardList, Calculator } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";

const unitOptions = [
  { value: "piece", label: "Piece" },
  { value: "sheet", label: "Sheet" },
  { value: "sqft", label: "Square Feet" },
  { value: "pack", label: "Pack" },
  { value: "box", label: "Box" },
  { value: "bag", label: "Bag" },
  { value: "contractor", label: "Contractor" },
  { value: "gallon", label: "Gallon" },
];

const Materials: React.FC = () => {
  const { project, addMaterial, removeMaterial, updateMaterial, calculateMaterials, getTotalMaterialCost } = useProject();
  const { toast } = useToast();
  
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("piece");
  const [unitCost, setUnitCost] = useState(0);
  const [quantity, setQuantity] = useState(0);
  
  const resetForm = () => {
    setName("");
    setUnit("piece");
    setUnitCost(0);
    setQuantity(0);
    setEditingMaterial(null);
  };
  
  const handleOpenDialog = (material?: Material) => {
    if (material) {
      // Editing existing material
      setName(material.name);
      setUnit(material.unit);
      setUnitCost(material.unitCost);
      setQuantity(material.quantity);
      setEditingMaterial(material);
    } else {
      // Adding new material
      resetForm();
    }
    setMaterialDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setMaterialDialogOpen(false);
    resetForm();
  };
  
  const handleSaveMaterial = () => {
    if (name.trim() === "" || unitCost <= 0 || quantity <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }
    
    const materialData = {
      name,
      unit,
      unitCost,
      quantity,
      totalCost: unitCost * quantity,
    };
    
    if (editingMaterial) {
      updateMaterial({ ...materialData, id: editingMaterial.id, totalCost: unitCost * quantity });
    } else {
      addMaterial(materialData);
    }
    
    handleCloseDialog();
  };
  
  const handleDeleteMaterial = (id: string) => {
    removeMaterial(id);
  };
  
  const handleCalculateMaterials = () => {
    calculateMaterials();
  };
  
  const totalCost = getTotalMaterialCost();
  
  if (!project) {
    return null;
  }
  
  // Check if there are existing materials
  const hasMaterials = project.materials.length > 0;
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materials</h1>
          <p className="text-gray-500 mt-1">
            Manage and track all materials for your project
          </p>
        </div>
        
        <div className="flex space-x-4">
          {/* Only show Auto Calculate button when there are no materials */}
          {!hasMaterials && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Calculator className="mr-2 h-4 w-4" /> Auto Calculate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Calculate Materials</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will calculate material quantities based on your room dimensions. 
                    Any manually entered materials with the same name will be updated.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCalculateMaterials}>
                    Calculate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Button 
            onClick={() => handleOpenDialog()} 
            className="bg-basement-blue-600 hover:bg-basement-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Material
          </Button>
        </div>
      </div>
      
      {hasMaterials ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Materials List</CardTitle>
            <CardDescription>
              Total Cost: ${formatCurrency(totalCost)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.quantity}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>${formatCurrency(material.unitCost, true)}</TableCell>
                    <TableCell>${formatCurrency(material.totalCost)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenDialog(material)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteMaterial(material.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center p-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gray-100 p-4">
              <ClipboardList className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Materials Added Yet</h2>
          <p className="text-gray-500 mb-4">
            Add materials manually or use the Auto Calculate feature to generate materials based on your room dimensions.
          </p>
          <div className="flex justify-center space-x-4">
            {/* Only display Auto Calculate button when there are no materials */}
            <Button 
              variant="outline" 
              onClick={handleCalculateMaterials}
            >
              <Calculator className="mr-2 h-4 w-4" /> Auto Calculate
            </Button>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-basement-blue-600 hover:bg-basement-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Material Manually
            </Button>
          </div>
        </Card>
      )}
      
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? "Edit Material" : "Add New Material"}
            </DialogTitle>
            <DialogDescription>
              Enter the details of the material needed for your project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material-name">Material Name</Label>
              <Input
                id="material-name"
                placeholder="e.g., 2x4x8' Lumber, Drywall Sheet"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select 
                  value={unit} 
                  onValueChange={setUnit}
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-cost">Unit Cost ($)</Label>
                <Input
                  id="unit-cost"
                  type="number"
                  step="0.01"
                  value={unitCost || ""}
                  onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity || ""}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="flex justify-between p-3 bg-gray-50 rounded border">
              <span className="font-medium">Total Cost:</span>
              <span>${formatCurrency((unitCost || 0) * (quantity || 0))}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveMaterial} className="bg-basement-blue-600 hover:bg-basement-blue-700">
              {editingMaterial ? "Update" : "Save"} Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Materials;
