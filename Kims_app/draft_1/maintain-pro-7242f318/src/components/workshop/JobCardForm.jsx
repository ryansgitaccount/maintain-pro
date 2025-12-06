
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { X, Save, Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";

export default function JobCardForm({ jobCard, machines, operatorNames, crewNames, onSubmit, onCancel }) {
    const [formData, setFormData] = useState(jobCard || {
        job_number: `JOB-${Date.now()}`, // Auto-generate job number for new cards
        machine_id: '',
        status: 'new',
        priority: 'medium',
        crew_name: '', // Added crew_name field
        reported_by: '',
        date_reported: new Date().toISOString(),
        order_number: '', // Added order_number field
        fault_description: '',
        work_to_be_done: '',
        mechanic_assigned: '',
        parts_used: [],
        labour_hours: '',
        total_cost: '',
        completion_notes: '',
        date_completed: null,
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (field, date) => {
        setFormData(prev => ({ ...prev, [field]: date?.toISOString() }));
    };

    const handleArrayChange = (arrayName, index, field, value) => {
        const newArray = [...formData[arrayName]];
        newArray[index][field] = value;
        setFormData(prev => ({ ...prev, [arrayName]: newArray }));
    };

    const addArrayItem = (arrayName) => {
        const newItem = arrayName === 'parts_used' ? { part_name: '', part_number: '', quantity: 1, cost: 0 } : {};
        setFormData(prev => ({ ...prev, [arrayName]: [...(prev[arrayName] || []), newItem] }));
    };

    const removeArrayItem = (arrayName, index) => {
        setFormData(prev => ({ ...prev, [arrayName]: formData[arrayName].filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const dataToSubmit = { ...formData };

        // Convert empty strings for number fields to null, otherwise parse as float.
        if (dataToSubmit.labour_hours === '' || dataToSubmit.labour_hours === null || dataToSubmit.labour_hours === undefined) {
            dataToSubmit.labour_hours = null;
        } else {
            dataToSubmit.labour_hours = parseFloat(dataToSubmit.labour_hours);
        }

        if (dataToSubmit.total_cost === '' || dataToSubmit.total_cost === null || dataToSubmit.total_cost === undefined) {
            dataToSubmit.total_cost = null;
        } else {
            dataToSubmit.total_cost = parseFloat(dataToSubmit.total_cost);
        }

        // Also sanitize parts_used numbers
        if (dataToSubmit.parts_used) {
            dataToSubmit.parts_used = dataToSubmit.parts_used.map(part => ({
                ...part,
                quantity: part.quantity === '' || part.quantity === null || part.quantity === undefined ? null : parseFloat(part.quantity),
                cost: part.cost === '' || part.cost === null || part.cost === undefined ? null : parseFloat(part.cost),
            }));
        }

        onSubmit(dataToSubmit);
    };

    return (
        <Card className="bg-white shadow-lg border-slate-200 mb-8 max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-slate-900">
                        {jobCard ? 'Edit Job Card' : 'Create New Job Card'}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="job_number">Job Number *</Label>
                            <Input id="job_number" value={formData.job_number} onChange={e => handleInputChange('job_number', e.target.value)} required disabled className="bg-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="machine_id">Machine *</Label>
                            <Select value={formData.machine_id} onValueChange={value => handleInputChange('machine_id', value)} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select machine..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {machines.map(m => <SelectItem key={m.id} value={m.id}>{m.plant_id} - {m.model}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date_reported">Date Reported</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.date_reported ? format(new Date(formData.date_reported), 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={formData.date_reported ? new Date(formData.date_reported) : null} onSelect={date => handleDateChange('date_reported', date)} />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="reported_by">Reported By</Label>
                            <Input id="reported_by" value={formData.reported_by} onChange={e => handleInputChange('reported_by', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="crew_name">Crew</Label>
                            <Select value={formData.crew_name} onValueChange={value => handleInputChange('crew_name', value)}>
                                <SelectTrigger><SelectValue placeholder="Assign crew..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>Unassigned</SelectItem>
                                    {crewNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="mechanic_assigned">Mechanic Assigned</Label>
                        <Select value={formData.mechanic_assigned} onValueChange={value => handleInputChange('mechanic_assigned', value)}>
                            <SelectTrigger><SelectValue placeholder="Assign mechanic..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>Unassigned</SelectItem>
                                {operatorNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="order_number">Order Number (Parts/Outwork)</Label>
                        <Input id="order_number" value={formData.order_number || ''} onChange={e => handleInputChange('order_number', e.target.value)} placeholder="e.g., PO-12345" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fault_description">Fault Description *</Label>
                        <Textarea id="fault_description" value={formData.fault_description} onChange={e => handleInputChange('fault_description', e.target.value)} required rows={3} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="work_to_be_done">Work to be Done</Label>
                        <Textarea id="work_to_be_done" value={formData.work_to_be_done} onChange={e => handleInputChange('work_to_be_done', e.target.value)} rows={3} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-lg font-semibold">Parts Used</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('parts_used')}><Plus className="w-4 h-4 mr-2" />Add Part</Button>
                        </div>
                        <div className="space-y-2">
                            {formData.parts_used?.map((part, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-2 items-center p-2 border rounded-md">
                                    <Input placeholder="Part Name" value={part.part_name} onChange={e => handleArrayChange('parts_used', index, 'part_name', e.target.value)} className="flex-1" />
                                    <Input placeholder="Part Number" value={part.part_number} onChange={e => handleArrayChange('parts_used', index, 'part_number', e.target.value)} className="flex-1" />
                                    <Input type="number" placeholder="Qty" value={part.quantity} onChange={e => handleArrayChange('parts_used', index, 'quantity', e.target.value)} className="w-20" />
                                    <Input type="number" placeholder="Cost" value={part.cost} onChange={e => handleArrayChange('parts_used', index, 'cost', e.target.value)} className="w-24" />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('parts_used', index)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="labour_hours">Labour Hours</Label>
                            <Input type="number" id="labour_hours" value={formData.labour_hours} onChange={e => handleInputChange('labour_hours', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="total_cost">Total Cost</Label>
                            <Input type="number" id="total_cost" value={formData.total_cost} onChange={e => handleInputChange('total_cost', e.target.value)} />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="completion_notes">Completion Notes</Label>
                        <Textarea id="completion_notes" value={formData.completion_notes} onChange={e => handleInputChange('completion_notes', e.target.value)} rows={3} />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="date_completed">Date Completed</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.date_completed ? format(new Date(formData.date_completed), 'PPP') : 'Pick a date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={formData.date_completed ? new Date(formData.date_completed) : null} onSelect={date => handleDateChange('date_completed', date)} />
                            </PopoverContent>
                        </Popover>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">
                        <Save className="w-4 h-4 mr-2" />
                        {jobCard ? 'Update' : 'Save'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
