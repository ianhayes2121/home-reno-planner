
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useProject } from "@/contexts/ProjectContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Room } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Plus, Square } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Rooms: React.FC = () => {
  const { project, addRoom, removeRoom, updateRoom } = useProject();
  const { toast } = useToast();
  
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  const [name, setName] = useState("");
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(8); // Default height 8'
  const [hasBulkhead, setHasBulkhead] = useState(false);
  const [bulkheadLength, setBulkheadLength] = useState(0);
  
  const resetForm = () => {
    setName("");
    setLength(0);
    setWidth(0);
    setHeight(8);
    setHasBulkhead(false);
    setBulkheadLength(0);
    setEditingRoom(null);
  };
  
  const handleOpenDialog = (room?: Room) => {
    if (room) {
      // Editing existing room
      setName(room.name);
      setLength(room.length);
      setWidth(room.width);
      setHeight(room.height);
      setHasBulkhead(room.hasBulkhead);
      setBulkheadLength(room.bulkheadLength);
      setEditingRoom(room);
    } else {
      // Adding new room
      resetForm();
    }
    setRoomDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setRoomDialogOpen(false);
    resetForm();
  };
  
  const handleSaveRoom = () => {
    if (name.trim() === "" || length <= 0 || width <= 0 || height <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }
    
    if (hasBulkhead && bulkheadLength <= 0) {
      toast({
        title: "Invalid Bulkhead Length",
        description: "If the room has a bulkhead, please specify its length.",
        variant: "destructive",
      });
      return;
    }
    
    const roomData = {
      name,
      length,
      width,
      height,
      hasBulkhead,
      bulkheadLength: hasBulkhead ? bulkheadLength : 0,
    };
    
    if (editingRoom) {
      updateRoom({ ...roomData, id: editingRoom.id });
    } else {
      addRoom(roomData);
    }
    
    handleCloseDialog();
  };
  
  const handleDeleteRoom = (id: string) => {
    removeRoom(id);
  };
  
  const calculateArea = (length: number, width: number) => {
    return length * width;
  };
  
  if (!project) {
    return null;
  }
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-500 mt-1">Define the rooms in your basement</p>
        </div>
        
        <Button 
          onClick={() => handleOpenDialog()} 
          className="bg-basement-blue-600 hover:bg-basement-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Room
        </Button>
      </div>
      
      {project.rooms.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Name</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Bulkhead</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>{`${room.length}' × ${room.width}' × ${room.height}'`}</TableCell>
                  <TableCell>{calculateArea(room.length, room.width)} sq ft</TableCell>
                  <TableCell>
                    {room.hasBulkhead ? `Yes (${room.bulkheadLength}')` : "No"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenDialog(room)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="text-center p-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gray-100 p-4">
              <Square className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Rooms Added Yet</h2>
          <p className="text-gray-500 mb-4">
            Start by adding rooms to your basement renovation project.
          </p>
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-basement-blue-600 hover:bg-basement-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Your First Room
          </Button>
        </Card>
      )}
      
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Edit Room" : "Add New Room"}
            </DialogTitle>
            <DialogDescription>
              Enter the dimensions and details of your basement room.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                placeholder="e.g., Main Area, Bedroom, Home Office"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length (feet)</Label>
                <Input
                  id="length"
                  type="number"
                  value={length || ""}
                  onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (feet)</Label>
                <Input
                  id="width"
                  type="number"
                  value={width || ""}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (feet)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height || ""}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-bulkhead"
                checked={hasBulkhead}
                onCheckedChange={(checked) => setHasBulkhead(checked === true)}
              />
              <Label htmlFor="has-bulkhead">This room has a bulkhead</Label>
            </div>
            
            {hasBulkhead && (
              <div className="space-y-2">
                <Label htmlFor="bulkhead-length">Bulkhead Length (feet)</Label>
                <Input
                  id="bulkhead-length"
                  type="number"
                  value={bulkheadLength || ""}
                  onChange={(e) => setBulkheadLength(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoom} className="bg-basement-blue-600 hover:bg-basement-blue-700">
              {editingRoom ? "Update" : "Save"} Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Rooms;
