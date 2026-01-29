
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Plus } from "lucide-react";

export default function MachineForm({ machine, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(machine || {
    plant_id: "", // Changed from unit_number
    model: "",
    manufacturer: "",
    serial_number: "",
    year: "",
    attachment: "",
    status: "operational",
    crew_name: "",
    last_service_date: "",
    last_service_hours: "",
    service_interval_hours: 200,
    current_operating_hours: 0,
    machine_type: "feller_buncher",
    notes: []
  });
  const [newNote, setNewNote] = useState("");

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddNote = () => {
    if (newNote.trim() === "") return;
    const noteEntry = {
        note: newNote,
        date: new Date().toISOString()
    };
    const existingNotes = Array.isArray(formData.notes) ? formData.notes : [];
    setFormData(prev => ({
        ...prev,
        notes: [...existingNotes, noteEntry]
    }));
    setNewNote("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalFormData = { ...formData };

    if (newNote.trim() !== "") {
        const noteEntry = {
            note: newNote,
            date: new Date().toISOString()
        };
        const existingNotes = Array.isArray(finalFormData.notes) ? finalFormData.notes : [];
        finalFormData.notes = [...existingNotes, noteEntry];
    }
    
    const dataToSubmit = {
      ...finalFormData,
      year: finalFormData.year === '' || isNaN(parseInt(finalFormData.year, 10)) ? null : parseInt(finalFormData.year, 10),
      last_service_hours: finalFormData.last_service_hours === '' || isNaN(parseInt(finalFormData.last_service_hours, 10)) ? null : parseInt(finalFormData.last_service_hours, 10),
      current_operating_hours: finalFormData.current_operating_hours === '' || isNaN(parseInt(finalFormData.current_operating_hours, 10)) ? 0 : parseInt(finalFormData.current_operating_hours, 10),
      service_interval_hours: finalFormData.service_interval_hours === '' || isNaN(parseInt(finalFormData.service_interval_hours, 10)) ? 200 : parseInt(finalFormData.service_interval_hours, 10)
    };
    onSubmit(dataToSubmit);
  };

  return (
    <Card className="bg-white shadow-lg border-slate-200 mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-900">
            {machine ? 'Edit Plant' : 'Add New Plant'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant_id">Plant # *</Label> {/* Changed from unit_number to plant_id and label text */}
              <Input
                id="plant_id" // Changed from unit_number
                value={formData.plant_id || ''} // Changed from unit_number
                onChange={(e) => handleInputChange('plant_id', e.target.value)} // Changed from unit_number
                placeholder="e.g., BL-101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="e.g., 568H"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer *</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                placeholder="e.g., Caterpillar"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => handleInputChange('serial_number', e.target.value)}
                placeholder="e.g., SN123456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.year || ''}
                onChange={(e) => handleInputChange('year', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="e.g., 2020"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment">Attachment</Label>
              <Input
                id="attachment"
                value={formData.attachment || ''}
                onChange={(e) => handleInputChange('attachment', e.target.value)}
                placeholder="e.g., Grapple, Forks"
              />
            </div>
          </div>

          {/* Status, Type, and Crew */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="machine_type">Machine Type</Label>
              <Select
                value={formData.machine_type}
                onValueChange={(value) => handleInputChange('machine_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feller_buncher">Feller Buncher</SelectItem>
                  <SelectItem value="skidder">Skidder</SelectItem>
                  <SelectItem value="forwarder">Forwarder</SelectItem>
                  <SelectItem value="harvester">Harvester</SelectItem>
                  <SelectItem value="delimber">Delimber</SelectItem>
                  <SelectItem value="loader">Loader</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="chainsaw">Chainsaw</SelectItem>
                  <SelectItem value="bulldozer">Bulldozer</SelectItem>
                  <SelectItem value="excavator">Excavator</SelectItem>
                  <SelectItem value="chipper">Chipper</SelectItem>
                  <SelectItem value="traction_assist">Traction Assist</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="not_in_use">Not In Use</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="needs_service">Needs Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="crew_name">Crew</Label>
              <Select
                value={formData.crew_name || ""}
                onValueChange={(value) => handleInputChange('crew_name', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign a crew..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {["BBC", "BGB", "Boar", "Boar Extra", "Bryant", "BSW", "Bull", "Chamois", "L9", "NBL", "Viking", "Stag", "Other"].map(crew => (
                    <SelectItem key={crew} value={crew}>{crew}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_operating_hours">Current Operating Hours</Label>
              <Input
                id="current_operating_hours"
                type="number"
                min="0"
                value={formData.current_operating_hours}
                onChange={(e) => handleInputChange('current_operating_hours', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_interval_hours">Service Interval (hours)</Label>
              <Input
                id="service_interval_hours"
                type="number"
                min="1"
                value={formData.service_interval_hours}
                onChange={(e) => handleInputChange('service_interval_hours', e.target.value)}
                placeholder="200"
              />
            </div>
          </div>

          {/* Service Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="last_service_date">Last Service Date</Label>
              <Input
                id="last_service_date"
                type="date"
                value={formData.last_service_date}
                onChange={(e) => handleInputChange('last_service_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_service_hours">Last Service Hours</Label>
              <Input
                id="last_service_hours"
                type="number"
                min="0"
                value={formData.last_service_hours}
                onChange={(e) => handleInputChange('last_service_hours', e.target.value)}
                placeholder="Machine hours at last service"
              />
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="new_note">Notes</Label>
            <div className="flex gap-2">
                <Textarea
                    id="new_note"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new time-stamped note..."
                    rows={3}
                    className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddNote} className="self-start">
                    <Plus className="w-5 h-5" />
                </Button>
            </div>
            {Array.isArray(formData.notes) && formData.notes.length > 0 && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto bg-slate-50 p-2 rounded-md border">
                    {formData.notes.map((n, i) => (
                        <p key={i} className="text-sm text-slate-600 border-b pb-1">
                            {n.date ? `[${new Date(n.date).toLocaleDateString()} ${new Date(n.date).toLocaleTimeString()}] ` : ''}{n.note}
                        </p>
                    ))}
                </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-slate-800 hover:bg-slate-700">
            <Save className="w-4 h-4 mr-2" />
            {machine ? 'Update Plant' : 'Add Plant'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
