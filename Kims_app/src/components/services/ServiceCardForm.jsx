
import React, { useState, useMemo, useEffect } from 'react';
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
import { Employee, Crew } from "@/api/entities";

export default function ServiceCardForm({ serviceCard, machines, onSubmit, onCancel }) {
    const [operatorNames, setOperatorNames] = useState([]);
    const [crewNames, setCrewNames] = useState([]);
    const [formData, setFormData] = useState(serviceCard || {
        machine_id: '',
        plant_id: '', // New field
        service_date: new Date().toISOString(),
        service_type: 'scheduled', // Default value changed
        machine_hours_at_service: '',
        serviced_by: '',
        crew_name: '',
        parts_used: [],
        labour_hours: '',
        total_cost: '',
        work_description: '',
        notes: '',
        status: 'open'
    });

    useEffect(() => {
        // If a machine is selected, automatically update the plant_id
        if (formData.machine_id) {
            const machine = machines.find(m => m.id === formData.machine_id);
            if (machine && machine.plant_id !== formData.plant_id) {
                setFormData(prev => ({ ...prev, plant_id: machine.plant_id }));
            }
        } else if (formData.plant_id !== '') { // Clear plant_id if machine_id is cleared
             setFormData(prev => ({ ...prev, plant_id: '' }));
        }
    }, [formData.machine_id, machines, formData.plant_id]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [employees, crews] = await Promise.all([Employee.list(), Crew.list()]);
                setOperatorNames(employees.map(e => e.full_name).sort());
                setCrewNames(crews.map(c => c.name).sort());
            } catch (error) {
                console.error("Failed to load employees and crews:", error);
            }
        };
        fetchData();
    }, []);


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
        const newItem = { part_name: '', part_number: '', quantity: 1, cost: 0 };
        setFormData(prev => ({ ...prev, [arrayName]: [...(prev[arrayName] || []), newItem] }));
    };

    const removeArrayItem = (arrayName, index) => {
        setFormData(prev => ({ ...prev, [arrayName]: formData[arrayName].filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = { ...formData };

        ['machine_hours_at_service', 'labour_hours', 'total_cost'].forEach(field => {
            if (dataToSubmit[field] === '' || dataToSubmit[field] === null || dataToSubmit[field] === undefined) {
                dataToSubmit[field] = null;
            } else {
                dataToSubmit[field] = parseFloat(dataToSubmit[field]);
            }
        });

        if (dataToSubmit.parts_used) {
            dataToSubmit.parts_used = dataToSubmit.parts_used.map(part => ({
                ...part,
                quantity: part.quantity ? parseFloat(part.quantity) : null,
                cost: part.cost ? parseFloat(part.cost) : null,
            }));
        }

        onSubmit(dataToSubmit);
    };

    // Removed machineOptions useMemo as we are now directly mapping machines in SelectContent

    return (
        <Card className="bg-white shadow-lg border-slate-200 mb-8 max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-slate-900">
                        {serviceCard ? 'Edit Service Card' : 'Create New Service Card'}
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
                            <Label htmlFor="machine_id">Machine (Plant #) *</Label>
                            <Select
                                value={formData.machine_id}
                                onValueChange={(value) => handleInputChange('machine_id', value)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a machine..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {machines.map(machine => (
                                        <SelectItem key={machine.id} value={machine.id}>
                                            {machine.plant_id} - {machine.model}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="service_date">Service Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.service_date ? format(new Date(formData.service_date), 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={formData.service_date ? new Date(formData.service_date) : null} onSelect={date => handleDateChange('service_date', date)} />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="service_type">Service Type *</Label>
                            <Select value={formData.service_type || ''} onValueChange={value => handleInputChange('service_type', value)} required>
                                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="250hr">250hr</SelectItem>
                                    <SelectItem value="500hr">500hr</SelectItem>
                                    <SelectItem value="1000hr">1000hr</SelectItem>
                                    <SelectItem value="2000hr">2000hr</SelectItem>
                                    <SelectItem value="ad_hoc">Ad-hoc</SelectItem>
                                    <SelectItem value="repair">Repair</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="machine_hours_at_service">Machine Hours *</Label>
                            <Input id="machine_hours_at_service" type="number" value={formData.machine_hours_at_service} onChange={e => handleInputChange('machine_hours_at_service', e.target.value)} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="serviced_by">Serviced By</Label>
                            <Select value={formData.serviced_by} onValueChange={value => handleInputChange('serviced_by', value)}>
                                <SelectTrigger><SelectValue placeholder="Select technician..." /></SelectTrigger>
                                <SelectContent>
                                    {operatorNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="crew_name">Crew</Label>
                             <Select value={formData.crew_name} onValueChange={value => handleInputChange('crew_name', value)}>
                                <SelectTrigger><SelectValue placeholder="Select crew..." /></SelectTrigger>
                                <SelectContent>
                                    {crewNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="work_description">Work Description</Label>
                        <Textarea id="work_description" value={formData.work_description} onChange={e => handleInputChange('work_description', e.target.value)} rows={3} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-lg font-semibold">Parts Used</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('parts_used')}><Plus className="w-4 h-4 mr-2" />Add Part</Button>
                        </div>
                        <div className="space-y-2">
                            {formData.parts_used?.map((part, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-2 items-center p-2 border rounded-md">
                                    <Input placeholder="Part Name" value={part.part_name || ''} onChange={e => handleArrayChange('parts_used', index, 'part_name', e.target.value)} className="flex-1" />
                                    <Input placeholder="Part Number" value={part.part_number || ''} onChange={e => handleArrayChange('parts_used', index, 'part_number', e.target.value)} className="flex-1" />
                                    <Input type="number" placeholder="Qty" value={part.quantity || ''} onChange={e => handleArrayChange('parts_used', index, 'quantity', e.target.value)} className="w-20" />
                                    <Input type="number" placeholder="Cost" value={part.cost || ''} onChange={e => handleArrayChange('parts_used', index, 'cost', e.target.value)} className="w-24" />
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
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} rows={3} />
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">
                        <Save className="w-4 h-4 mr-2" />
                        {serviceCard ? 'Update' : 'Save'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
