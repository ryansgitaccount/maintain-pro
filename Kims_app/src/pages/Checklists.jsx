
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MaintenanceChecklist, Machine, MaintenanceRecord, Employee, Crew } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Plus,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  Shield,
  MapPin,
  Wrench,
  Eye,
  Copy,
  ServerCrash,
  ClipboardX,
  CheckCircle2
} from "lucide-react";
import { subDays, parseISO } from 'date-fns';

import ChecklistForm from "../components/checklists/ChecklistForm";
import ChecklistCard from "../components/checklists/ChecklistCard";
import ChecklistExecutor from "../components/checklists/ChecklistExecutor";
import { useToast } from "@/components/ui/use-toast";
// import { InvokeLLM } from "@/api/integrations"; // TODO: Implement LLM integration via Supabase Edge Functions

export default function Checklists() {
  const [checklists, setChecklists] = useState([]);
  const [machines, setMachines] = useState([]);
  const [records, setRecords] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showExecutor, setShowExecutor] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [executingChecklist, setExecutingChecklist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [atRiskMachines, setAtRiskMachines] = useState([]);
  const [operatorNames, setOperatorNames] = useState([]);
  const [crewNames, setCrewNames] = useState([]);
  const { toast } = useToast();

  const getAtRiskMachineIds = useCallback(async () => {
    // TODO: Implement LLM-based at-risk detection via Supabase Edge Functions
    // For now, return empty array to avoid LLM integration error
    return [];
  }, [toast]);
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user); // Set current user immediately

        const [checklistsData, machinesData, recordsData, atRiskIds, employees, crews] = await Promise.all([
          MaintenanceChecklist.list('-updated_at'),
          Machine.list('-plant_id'),
          MaintenanceRecord.filter({ created_by: user?.id }, "-created_date", 100),
          getAtRiskMachineIds(),
          Employee.list(),
          Crew.list()
        ]);

        setChecklists(checklistsData);
        setMachines(machinesData);
        setRecords(recordsData);
        setOperatorNames(employees.map(e => e.full_name).sort());
        setCrewNames(crews.map(c => c.name).sort());

        const atRisk = machinesData
            .filter(m => atRiskIds.includes(m.id))
            .sort((a,b) => (a.plant_id || '').localeCompare(b.plant_id || ''));
        setAtRiskMachines(atRisk);

    } catch(err) {
        console.error("Error loading data", err);
    } finally {
        setIsLoading(false);
    }
  }, [getAtRiskMachineIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (checklistData) => {
    if (!navigator.onLine) {
        toast({ title: "Offline", description: "Cannot create or update checklists while offline.", variant: 'warning' });
        return;
    }
    if (editingChecklist && editingChecklist.id) {
      await MaintenanceChecklist.update(editingChecklist.id, checklistData);
    } else {
      await MaintenanceChecklist.create(checklistData);
    }
    setShowForm(false);
    setEditingChecklist(null);
    setIsDuplicating(false); // Reset duplication state on submit
    loadData();
  };

  const handleEdit = (checklist) => {
    setEditingChecklist(checklist);
    setIsDuplicating(false); // Not duplicating when editing an existing one
    setShowForm(true);
  };

  const handleDuplicate = (checklist) => {
    const duplicatedChecklist = {
      ...checklist,
      name: `Copy of ${checklist.name}`,
      id: undefined, // Ensure new ID is generated
      created_at: undefined, // Clear creation date
      updated_at: undefined, // Clear update date
      created_by: undefined // Clear creator, will be set on save
    };

    setEditingChecklist(duplicatedChecklist);
    setIsDuplicating(true); // Set duplication state
    setShowForm(true);
    toast({
      title: "Checklist Duplicated",
      description: "You can now edit the duplicated checklist before saving.",
      variant: 'info'
    });
  };

  const handleExecute = (checklist) => {
    setExecutingChecklist(checklist);
    setShowExecutor(true);
  };

  const handleDelete = async (checklistId) => {
    if (!navigator.onLine) {
        toast({ title: "Offline", description: "Cannot delete checklists while offline.", variant: 'warning' });
        return;
    }
    await MaintenanceChecklist.delete(checklistId);
    loadData();
  };

  const getSafetyLevelColor = (level) => {
    const colors = {
      standard: "bg-blue-100 text-blue-800 border-blue-200",
      high_risk: "bg-amber-100 text-amber-800 border-amber-200",
      critical: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[level] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getMaintenanceTypeColor = (type) => {
    const colors = {
      daily: "bg-green-100 text-green-800 border-green-200",
      weekly: "bg-blue-100 text-blue-800 border-blue-200",
      monthly: "bg-purple-100 text-purple-800 border-purple-200",
      "250_hour": "bg-orange-100 text-orange-800 border-orange-200",
      "500_hour": "bg-red-100 text-red-800 border-red-200",
      "1000_hour": "bg-violet-100 text-violet-800 border-violet-200",
      emergency: "bg-red-200 text-red-900 border-red-300"
    };
    return colors[type] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Operator Checklists</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">Manage and execute standardized operator checklists</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => {
                  setEditingChecklist(null);
                  setIsDuplicating(false); // Ensure this is false when creating a new checklist
                  setShowForm(true);
              }}
              className="bg-slate-800 hover:bg-slate-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Checklist
            </Button>
          </div>
        </div>

        {/* At-Risk Dashboard */}
        <Accordion type="single" collapsible className="w-full mb-8" defaultValue="at-risk-machines">
            <AccordionItem value="at-risk-machines">
                <AccordionTrigger className={` ${atRiskMachines.length > 0 ? 'bg-red-100 border-red-300 hover:bg-red-200' : 'bg-green-50 border-green-200 hover:bg-green-100'} border px-4 py-3 rounded-lg data-[state=open]:rounded-b-none`}>
                    <div className="flex items-center gap-3">
                         {atRiskMachines.length > 0 ? (
                            <AlertTriangle className="w-5 h-5 text-red-700 animate-pulse" />
                         ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                         )}
                        <span className={`font-semibold ${atRiskMachines.length > 0 ? 'text-red-900' : 'text-green-800'}`}>
                            Machines Needing Attention
                        </span>
                        {atRiskMachines.length > 0 && (
                            <Badge variant="destructive" className="bg-red-200 text-red-900">{atRiskMachines.length}</Badge>
                        )}
                    </div>
                </AccordionTrigger>
                <AccordionContent className={`p-4 border border-t-0 bg-white rounded-b-lg ${atRiskMachines.length > 0 ? 'border-red-300' : 'border-green-200'}`}>
                    {atRiskMachines.length > 0 ? (
                        <>
                            <p className="text-sm text-slate-600 mb-3">These machines (status: Operational or Needs Service) have not had hours updated or a checklist completed in the last 7 days.</p>
                            <div className="flex flex-wrap gap-2">
                                {atRiskMachines.map(machine => (
                                    <Badge key={machine.id} variant="outline" className="border-red-400 text-red-900 bg-red-100 hover:bg-red-200">{machine.plant_id}</Badge>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-slate-600">All machines are up-to-date. No attention needed at this time.</p>
                    )}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        
        {/* Checklist Form */}
        {showForm && (
          <ChecklistForm
            checklist={editingChecklist}
            isDuplicating={isDuplicating}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingChecklist(null);
              setIsDuplicating(false); // Reset on cancel
            }}
            machines={machines}
          />
        )}

        {/* Checklist Executor */}
        {showExecutor && (
          <ChecklistExecutor
            checklist={executingChecklist}
            machines={machines}
            currentUser={currentUser}
            onComplete={() => {
              setShowExecutor(false);
              setExecutingChecklist(null);
              if(navigator.onLine) loadData();
            }}
            onCancel={() => {
              setShowExecutor(false);
              setExecutingChecklist(null);
            }}
            operatorNames={operatorNames}
            crewNames={crewNames}
          />
        )}

        {/* Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="bg-white shadow-sm border-slate-200 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-200 rounded flex-1"></div>
                    <div className="h-6 bg-slate-200 rounded flex-1"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : checklists.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No checklists found</p>
              <p className="text-slate-400">Create a new checklist to get started</p>
            </div>
          ) : (
            checklists.map((checklist) => (
              <ChecklistCard
                key={checklist.id}
                checklist={checklist}
                onEdit={handleEdit}
                onExecute={handleExecute}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                // Removed getSafetyLevelColor and getMaintenanceTypeColor from props as per outline
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
