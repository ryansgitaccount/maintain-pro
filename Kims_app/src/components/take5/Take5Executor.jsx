
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, AlertTriangle, ShieldCheck } from "lucide-react";
import { Take5Record, Employee } from "@/api/entities";
import { useToast } from "@/components/ui/useToast";
import { supabase } from "@/api/supabaseClient";

export default function Take5Executor({ onComplete, onCancel }) {
    const [operatorName, setOperatorName] = useState("");
    const [location, setLocation] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [hazards, setHazards] = useState("");
    const [controls, setControls] = useState("");
    const [isSafe, setIsSafe] = useState(false);
    const [operatorNames, setOperatorNames] = useState([]);
    const { toast } = useToast();

    useEffect(() => {
      const fetchOperatorsAndUser = async () => {
        try {
          const employees = await Employee.list();
          const names = employees.map(e => e.full_name).sort();
          setOperatorNames(names);
          
          const lastUsedName = localStorage.getItem('last_used_operator_name');
          if (lastUsedName && names.includes(lastUsedName)) {
            setOperatorName(lastUsedName);
          }
        } catch(error) {
          console.warn("Could not fetch employees:", error);
        }
      };
      fetchOperatorsAndUser();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!operatorName || !location || !taskDescription || !hazards || !controls) {
            toast({ title: "Missing Information", description: "Please fill out all fields.", variant: "warning" });
            return;
        }

        if (!isSafe) {
            toast({ title: "Safety Confirmation Required", description: "You must confirm it is safe to proceed.", variant: "warning" });
            return;
        }

        try {
            // Save the currently selected operator name to localStorage for future pre-filling
            localStorage.setItem('last_used_operator_name', operatorName);
        } catch (error) {
            console.warn("Could not save last used operator name:", error);
            // Non-critical error, continue with Take 5 record submission
        }

        const recordData = {
            operator_name: operatorName,
            location: location,
            task_description: taskDescription,
            hazards_identified: hazards,
            controls_implemented: controls,
            is_safe_to_proceed: isSafe,
            completed_at: new Date().toISOString()
        };

        try {
            await Take5Record.create(recordData);
            toast({ title: "Take 5 Complete", description: "Safety assessment has been saved.", variant: "success" });
            onComplete();
        } catch (error) {
            console.error("Failed to save Take 5 record:", error);
            toast({ title: "Save Error", description: "Could not save the record. Please try again.", variant: "destructive" });
        }
    };

    return (
        <Card className="bg-white shadow-lg border-slate-200 mb-8 max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                        Take 5 Safety Assessment
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="operator">Your Name *</Label>
                            <Select value={operatorName} onValueChange={setOperatorName} required>
                                <SelectTrigger id="operator">
                                    <SelectValue placeholder="Select your name..." />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {operatorNames.map(name => (
                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Work Area / Location *</Label>
                            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Section B, Landing 3" />
                        </div>
                    </div>

                    <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                        <h3 className="font-semibold text-slate-800">1. STOP & THINK: What is the task?</h3>
                        <Textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Briefly describe the work you are about to do..." />
                    </div>

                    <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                        <h3 className="font-semibold text-slate-800">2. LOOK & IDENTIFY: What are the hazards?</h3>
                        <Textarea value={hazards} onChange={(e) => setHazards(e.target.value)} placeholder="List potential hazards (e.g., unstable ground, overhead lines, other machines, weather)..." />
                    </div>
                    
                    <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                        <h3 className="font-semibold text-slate-800">3. ASSESS & CONTROL: How will you control them?</h3>
                        <Textarea value={controls} onChange={(e) => setControls(e.target.value)} placeholder="Describe the controls you will use (e.g., establish exclusion zone, use spotter, wear specific PPE)..." />
                    </div>
                    
                    <div className="space-y-4 p-4 bg-green-50 border-green-200 rounded-lg">
                        <h3 className="font-semibold text-green-800 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5" />
                            4. PROCEED: Confirm it is safe
                        </h3>
                        <div className="flex items-start space-x-3">
                            <Checkbox id="isSafe" checked={isSafe} onCheckedChange={setIsSafe} className="mt-1" />
                            <Label htmlFor="isSafe" className="font-medium text-green-800">
                                I have identified all hazards, implemented controls, and confirm it is safe to proceed with the task.
                            </Label>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" className="bg-slate-800 hover:bg-slate-700">
                        <Save className="w-4 h-4 mr-2" />
                        Complete & Save Take 5
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
