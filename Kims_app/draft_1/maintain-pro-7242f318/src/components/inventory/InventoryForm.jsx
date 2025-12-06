import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

export default function InventoryForm({ item, machines, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    part_name: '',
    part_number: '',
    supplier: '',
    quantity_on_hand: 0,
    location: '',
    reorder_level: 0,
    cost_per_unit: '',
    notes: '',
    machine_id: '',
    machine_type: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        part_name: item.part_name || '',
        part_number: item.part_number || '',
        supplier: item.supplier || '',
        quantity_on_hand: item.quantity_on_hand || 0,
        location: item.location || '',
        reorder_level: item.reorder_level || 0,
        cost_per_unit: item.cost_per_unit || '',
        notes: item.notes || '',
        machine_id: item.machine_id || '',
        machine_type: item.machine_type || ''
      });
    }
  }, [item]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleNumberChange = (field, value) => {
    const num = value === '' ? '' : Number(value);
    if (!isNaN(num)) {
      handleInputChange(field, num);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const machineTypes = [...new Set(machines.map(m => m.machine_type).filter(Boolean))].sort();

  return (
    <Card className="bg-white shadow-lg border-slate-200 mb-8 max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-900">
            {item ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="part_name">Part Name *</Label>
              <Input id="part_name" value={formData.part_name} onChange={(e) => handleInputChange('part_name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="part_number">Part Number *</Label>
              <Input id="part_number" value={formData.part_number} onChange={(e) => handleInputChange('part_number', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <Label htmlFor="machine_type">Machine Type (Optional)</Label>
               <Select value={formData.machine_type} onValueChange={value => handleInputChange('machine_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a general machine type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  <SelectItem value="general">General Stock</SelectItem>
                  {machineTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="machine_id">Specific Machine (Optional)</Label>
              <Select value={formData.machine_id} onValueChange={value => handleInputChange('machine_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a specific machine..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {machines.sort((a,b) => (a.plant_id || '').localeCompare(b.plant_id || '')).map(machine => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.plant_id} - {machine.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input id="supplier" value={formData.supplier} onChange={(e) => handleInputChange('supplier', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="e.g., Shelf A-3, Bin 12" />
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="quantity_on_hand">Quantity On Hand *</Label>
              <Input id="quantity_on_hand" type="number" value={formData.quantity_on_hand} onChange={(e) => handleNumberChange('quantity_on_hand', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input id="reorder_level" type="number" value={formData.reorder_level} onChange={(e) => handleNumberChange('reorder_level', e.target.value)} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="cost_per_unit">Cost Per Unit</Label>
              <Input id="cost_per_unit" type="number" step="0.01" value={formData.cost_per_unit} onChange={(e) => handleNumberChange('cost_per_unit', e.target.value)} placeholder="e.g., 12.50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="Add any extra details here..." />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-slate-800 hover:bg-slate-700">
            <Save className="w-4 h-4 mr-2" />
            {item ? 'Update Item' : 'Save New Item'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}