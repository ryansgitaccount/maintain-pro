
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Plus, Trash2, Search } from "lucide-react";
import { Crew } from "@/api/entities";

export default function ChecklistForm({ checklist, onSubmit, onCancel, isDuplicating = false, machines = [] }) {
  const [machineSearch, setMachineSearch] = useState("");
  const [crews, setCrews] = useState([]);
  const [formData, setFormData] = useState(() => {
    if (isDuplicating && checklist) {
      const duplicatedChecklist = JSON.parse(JSON.stringify(checklist));
      delete duplicatedChecklist.id;
      // Remove hour_interval explicitly if it exists in duplicated checklist
      delete duplicatedChecklist.hour_interval;
      // Also remove maintenance_type and safety_level from duplicated checklist if they were present
      delete duplicatedChecklist.maintenance_type;
      delete duplicatedChecklist.safety_level;
      // Remove location_required explicitly if it exists in duplicated checklist
      delete duplicatedChecklist.location_required;
      return duplicatedChecklist;
    }
    return checklist || {
      plant_id: "",
      crew_id: "",
      description: "",
      tasks: [{ task: "", description: "", required: true, safety_critical: false, requires_measurement: false, measurement_unit: "", acceptable_range: "" }],
      required_tools: [""],
      required_parts: [],
      safety_requirements: [""],
      environmental_considerations: "",
      pre_work_safety_checks: [""]
    };
  });

  useEffect(() => {
    loadCrews();
  }, []);

  const loadCrews = async () => {
    try {
      const crewsList = await Crew.list('name');
      setCrews(crewsList);
    } catch (err) {
      console.error("Failed to load crews:", err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleMachineSelect = (plantId) => {
    setFormData(prev => ({
      ...prev,
      plant_id: plantId
    }));
  };

  const filteredMachines = machines.filter(machine =>
    machine.plant_id.toLowerCase().includes(machineSearch.toLowerCase()) ||
    machine.model?.toLowerCase().includes(machineSearch.toLowerCase())
  );

  const handleArrayItemChange = (arrayName, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) =>
        i === index
          ? (typeof item === 'object' ? { ...item, [field]: value } : value)
          : item
      )
    }));
  };

  const addArrayItem = (arrayName, defaultItem = "") => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], defaultItem]
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      name: formData.plant_id, // Use plant_id as the name
      tasks: formData.tasks.filter(task => task.task.trim()),
      required_tools: formData.required_tools.filter(tool => tool.trim()),
      safety_requirements: formData.safety_requirements.filter(req => req.trim()),
      pre_work_safety_checks: formData.pre_work_safety_checks.filter(check => check.trim())
    };
    // Remove fields that don't exist in database or are no longer used
    delete cleanedData.maintenance_type;
    delete cleanedData.safety_level;
    delete cleanedData.crew_name;
    delete cleanedData.location_required;
    onSubmit(cleanedData);
  };

  return (
    <Card className="bg-white shadow-lg border-slate-200 mb-8 max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-900">
            {isDuplicating ? 'Duplicate Checklist' : checklist ? 'Edit Checklist' : 'Create New Checklist'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Plant ID and Crew Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant_id">Plant ID *</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search Plant ID or model..."
                    value={machineSearch}
                    onChange={(e) => setMachineSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={formData.plant_id}
                  onValueChange={handleMachineSelect}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Plant ID..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMachines.length > 0 ? (
                      filteredMachines.map(machine => (
                        <SelectItem key={machine.id} value={machine.plant_id}>
                          {machine.plant_id} - {machine.model}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-slate-500">No machines found</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crew_id">Crew</Label>
            <Select
              value={formData.crew_id}
              onValueChange={(value) => handleInputChange('crew_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a crew..." />
              </SelectTrigger>
              <SelectContent>
                {crews.map(crew => (
                  <SelectItem key={crew.id} value={crew.id}>
                    {crew.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the purpose and scope of this checklist..."
              rows={3}
            />
          </div>

          {/* Classification (Machine Type) */}
          <div className="space-y-2">
            <Label htmlFor="machine_type">Machine Type</Label>
            <Select
              value={formData.machine_type}
              onValueChange={(value) => handleInputChange('machine_type', value)}
              disabled={!!formData.plant_id}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Machines</SelectItem>
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

          {/* Tasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Tasks</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('tasks', { task: "", description: "", required: true, safety_critical: false, requires_measurement: false, measurement_unit: "", acceptable_range: "" })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
            <div className="space-y-3">
              {formData.tasks.map((task, index) => (
                <Card key={index} className="border border-slate-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <Label className="font-medium">Task {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem('tasks', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Task name"
                      value={task.task}
                      onChange={(e) => handleArrayItemChange('tasks', index, 'task', e.target.value)}
                    />
                    <Textarea
                      placeholder="Task description and instructions"
                      value={task.description}
                      onChange={(e) => handleArrayItemChange('tasks', index, 'description', e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-4 flex-wrap">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={task.required}
                          onCheckedChange={(checked) => handleArrayItemChange('tasks', index, 'required', checked)}
                        />
                        <Label className="text-sm">Required</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={task.safety_critical}
                          onCheckedChange={(checked) => handleArrayItemChange('tasks', index, 'safety_critical', checked)}
                        />
                        <Label className="text-sm">Safety Critical</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={task.requires_measurement}
                          onCheckedChange={(checked) => handleArrayItemChange('tasks', index, 'requires_measurement', checked)}
                        />
                        <Label className="text-sm">Requires Measurement</Label>
                      </div>
                    </div>
                    {task.requires_measurement && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Unit (e.g., psi, °F)"
                          value={task.measurement_unit}
                          onChange={(e) => handleArrayItemChange('tasks', index, 'measurement_unit', e.target.value)}
                        />
                        <Input
                          placeholder="Acceptable range (e.g., 30-50 psi)"
                          value={task.acceptable_range}
                          onChange={(e) => handleArrayItemChange('tasks', index, 'acceptable_range', e.target.value)}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Safety Requirements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Safety Requirements</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('safety_requirements', "")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Safety Requirement
              </Button>
            </div>
            <div className="space-y-2">
              {formData.safety_requirements.map((req, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Safety requirement or PPE"
                    value={req}
                    onChange={(e) => handleArrayItemChange('safety_requirements', index, null, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeArrayItem('safety_requirements', index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Required Tools */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Required Tools</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('required_tools', "")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tool
              </Button>
            </div>
            <div className="space-y-2">
              {formData.required_tools.map((tool, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Tool or equipment needed"
                    value={tool}
                    onChange={(e) => handleArrayItemChange('required_tools', index, null, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeArrayItem('required_tools', index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Considerations */}
          <div className="space-y-2">
            <Label htmlFor="environmental_considerations">Environmental Considerations</Label>
            <Textarea
              id="environmental_considerations"
              value={formData.environmental_considerations}
              onChange={(e) => handleInputChange('environmental_considerations', e.target.value)}
              placeholder="Weather conditions, terrain considerations, seasonal factors..."
              rows={3}
            />
          </div>
          {/* Pre-Work Safety Checks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Pre-Work Safety Checks</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('pre_work_safety_checks', "")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Check
              </Button>
            </div>
            <div className="space-y-2">
              {formData.pre_work_safety_checks.map((check, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="e.g., Verify lockout/tagout procedures are in place"
                    value={check}
                    onChange={(e) => handleArrayItemChange('pre_work_safety_checks', index, null, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeArrayItem('pre_work_safety_checks', index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-slate-800 hover:bg-slate-700">
            <Save className="w-4 h-4 mr-2" />
            {isDuplicating ? 'Create Duplicated Checklist' : checklist ? 'Update Checklist' : 'Create Checklist'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
