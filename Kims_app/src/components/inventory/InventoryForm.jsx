import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

export default function InventoryForm({ item, machines, onSubmit, onCancel, open }) {
  const [formData, setFormData] = useState({
    machine_model: '',
    unique_id: '',
    nbl_code: '',
    serial_number: '',
    part_description: '',
    quantity_on_hand: '',
    service_interval: '',
    part_number_oem: '',
    part_number_aftermarket: '',
    notes: '',
    // Legacy fields (still supported)
    part_name: '',
    part_number: '',
    supplier: '',
    location: '',
    reorder_level: 0,
    cost_per_unit: '',
    machine_id: '',
    machine_type: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        machine_model: item.machine_model || '',
        unique_id: item.unique_id || '',
        nbl_code: item.nbl_code || '',
        serial_number: item.serial_number || '',
        part_description: item.part_description || item.part_name || '',
        quantity_on_hand: item.quantity_on_hand || '',
        service_interval: item.service_interval || '',
        part_number_oem: item.part_number_oem || '',
        part_number_aftermarket: item.part_number_aftermarket || '',
        notes: item.notes || '',
        // Legacy fields
        part_name: item.part_name || '',
        part_number: item.part_number || '',
        supplier: item.supplier || '',
        location: item.location || '',
        reorder_level: item.reorder_level || 0,
        cost_per_unit: item.cost_per_unit || '',
        machine_id: item.machine_id || '',
        machine_type: item.machine_type || ''
      });
    } else {
      // Reset form
      setFormData({
        machine_model: '',
        unique_id: '',
        nbl_code: '',
        serial_number: '',
        part_description: '',
        quantity_on_hand: '',
        service_interval: '',
        part_number_oem: '',
        part_number_aftermarket: '',
        notes: '',
        part_name: '',
        part_number: '',
        supplier: '',
        location: '',
        reorder_level: 0,
        cost_per_unit: '',
        machine_id: '',
        machine_type: ''
      });
    }
  }, [item, open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create payload with only filled fields
    const payload = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '' && formData[key] !== null) {
        payload[key] = formData[key];
      }
    });
    
    // Ensure part_description is used as part_name if part_name is empty
    if (payload.part_description && !payload.part_name) {
      payload.part_name = payload.part_description;
    }
    
    onSubmit(payload);
  };

  const machineTypes = [...new Set(machines.map(m => m.machine_type).filter(Boolean))].sort();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {item ? 'Edit Part' : 'Add New Part'}
          </DialogTitle>
          <DialogDescription>
            Enter the details for this inventory part. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Machine Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Machine Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="machine_model">Machine/Model</Label>
                  <Input 
                    id="machine_model" 
                    value={formData.machine_model} 
                    onChange={(e) => handleInputChange('machine_model', e.target.value)}
                    placeholder="e.g., Caterpillar 336DL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unique_id">Fleet ID</Label>
                  <Input 
                    id="unique_id" 
                    value={formData.unique_id} 
                    onChange={(e) => handleInputChange('unique_id', e.target.value)}
                    placeholder="e.g., 336-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nbl_code">NBL Code</Label>
                  <Input 
                    id="nbl_code" 
                    value={formData.nbl_code} 
                    onChange={(e) => handleInputChange('nbl_code', e.target.value)}
                    placeholder="e.g., 9210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input 
                    id="serial_number" 
                    value={formData.serial_number} 
                    onChange={(e) => handleInputChange('serial_number', e.target.value)}
                    placeholder="e.g., #057"
                  />
                </div>
              </div>
            </div>

            {/* Part Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Part Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="part_description">Part Description *</Label>
                  <Input 
                    id="part_description" 
                    value={formData.part_description} 
                    onChange={(e) => handleInputChange('part_description', e.target.value)}
                    placeholder="e.g., Engine Oil Filter"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity_on_hand">Quantity</Label>
                  <Input 
                    id="quantity_on_hand" 
                    value={formData.quantity_on_hand} 
                    onChange={(e) => handleInputChange('quantity_on_hand', e.target.value)}
                    placeholder="e.g., 2 or 1 Set"
                  />
                  <p className="text-xs text-slate-500">Can be a number or text like "1 Set", "2 Pair"</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_interval">Service Interval</Label>
                  <Input 
                    id="service_interval" 
                    value={formData.service_interval} 
                    onChange={(e) => handleInputChange('service_interval', e.target.value)}
                    placeholder="e.g., 250/500, 1000, When Required"
                  />
                </div>
              </div>
            </div>

            {/* Part Numbers */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Part Numbers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="part_number_oem">OEM Part Number</Label>
                  <Input 
                    id="part_number_oem" 
                    value={formData.part_number_oem} 
                    onChange={(e) => handleInputChange('part_number_oem', e.target.value)}
                    placeholder="e.g., Allison 23527033"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="part_number_aftermarket">Aftermarket Part Number</Label>
                  <Input 
                    id="part_number_aftermarket" 
                    value={formData.part_number_aftermarket} 
                    onChange={(e) => handleInputChange('part_number_aftermarket', e.target.value)}
                    placeholder="e.g., P552100"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Capacities</Label>
                <Textarea 
                  id="notes" 
                  value={formData.notes} 
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="e.g., Use Fleetguard, Oil capacity: 15L"
                  rows={3}
                />
              </div>
            </div>

            {/* Legacy Fields (Optional) */}
            <details className="space-y-4">
              <summary className="text-sm font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                Additional Fields (Optional)
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input 
                    id="supplier" 
                    value={formData.supplier} 
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={formData.location} 
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Shelf A-3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="machine_type">Machine Type</Label>
                  <Select value={formData.machine_type} onValueChange={value => handleInputChange('machine_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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
                  <Label htmlFor="machine_id">Specific Machine</Label>
                  <Select value={formData.machine_id} onValueChange={value => handleInputChange('machine_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specific machine..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {machines.sort((a,b) => (a.plant_id || '').localeCompare(b.plant_id || '')).map(machine => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.plant_id} - {machine.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </details>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              {item ? 'Update Part' : 'Add Part'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}