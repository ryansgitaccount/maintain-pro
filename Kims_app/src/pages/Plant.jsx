
import React, { useState, useEffect, useMemo } from "react";
import { Machine, MaintenanceRecord, WorkshopJobCard } from "@/api/entities"; // Removed ServiceCard
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Filter, Settings, MapPin, Calendar, PauseCircle, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useToast } from "@/components/ui/useToast";
import { useNavigate } from "react-router-dom"; // Added useNavigate
import { createPageUrl } from "@/utils"; // Added createPageUrl

import MachineForm from "../components/machines/MachineForm";
import MachineCard from "../components/machines/MachineCard";
// Removed ServiceCardForm import

const crewNames = ["BBC", "BGB", "Boar", "Boar Extra", "Bryant", "BSW", "Bull", "Chamois", "L9", "NBL", "Viking", "Stag", "Other"];

// Helper function to determine if a machine needs service based on hours
const doesMachineNeedService = (machine) => {
    // Check if required fields exist and are of correct type
    if (
        typeof machine.service_interval_hours !== 'number' ||
        typeof machine.current_operating_hours !== 'number' ||
        machine.service_interval_hours <= 0 // An interval of 0 or less doesn't make sense for scheduling
    ) {
        return false;
    }
    
    // Calculate the next service due based on last service hours or 0 if not set
    const lastServiceHours = machine.last_service_hours && typeof machine.last_service_hours === 'number'
        ? machine.last_service_hours
        : 0;

    const nextServiceDue = lastServiceHours + machine.service_interval_hours;

    // Machine needs service if current hours are at or past the due point
    return machine.current_operating_hours >= nextServiceDue;
};


export default function PlantPage() {
  const [machines, setMachines] = useState([]);
  const [records, setRecords] = useState([]); // New state for maintenance records
  const [jobCards, setJobCards] = useState([]); // New state for job cards
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [plantIdFilter, setPlantIdFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [crewFilter, setCrewFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  // Removed showServiceCardForm and machineForService state
  const { toast } = useToast();
  const navigate = useNavigate(); // Added navigate hook

  useEffect(() => {
    loadData();

    const handleAfterPrint = () => {
        const printStyle = document.getElementById('print-style-sheet');
        if (printStyle) {
            printStyle.remove();
        }
    };
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const lastActivityCrewMap = useMemo(() => {
    const map = new Map();
    
    const activities = [
        ...records.map(r => ({ machine_id: r.machine_id, crew_name: r.crew_name, date: r.completed_at })),
        ...jobCards.map(j => ({ machine_id: j.machine_id, crew_name: j.crew_name, date: j.date_reported }))
    ].filter(a => a.date); // Ensure activity has a date

    // Sort all activities by date, most recent first
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Iterate through sorted activities to find the latest crew for each machine
    for (const activity of activities) {
        if (activity.machine_id && !map.has(activity.machine_id)) {
            if (activity.crew_name) {
               map.set(activity.machine_id, activity.crew_name);
            }
        }
    }
    return map;
  }, [records, jobCards]);

  useEffect(() => {
    let filtered = machines;

    if (plantIdFilter !== "all") {
      filtered = filtered.filter(machine => machine.plant_id === plantIdFilter);
    }

    if (statusFilter !== "all") {
        if (statusFilter === 'needs_service') {
            filtered = filtered.filter(machine => 
                machine.status === 'needs_service' || doesMachineNeedService(machine)
            );
        } else {
            filtered = filtered.filter(machine => machine.status === statusFilter);
        }
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(machine => machine.machine_type === typeFilter);
    }
    
    if (crewFilter !== "all") {
      filtered = filtered.filter(machine => {
        const assignedCrew = machine.crew_name;
        const lastUsedCrew = lastActivityCrewMap.get(machine.id);
        return assignedCrew === crewFilter || lastUsedCrew === crewFilter;
      });
    }

    setFilteredMachines(filtered);
  }, [machines, plantIdFilter, statusFilter, typeFilter, crewFilter, lastActivityCrewMap]);

  const loadData = async () => {
    setIsLoading(true);
    const [machinesData, recordsData, jobCardsData] = await Promise.all([
        Machine.list('-updated_at'),
        MaintenanceRecord.list('-completed_at', 500), 
        WorkshopJobCard.list('-date_reported', 500)
    ]);
    setMachines(machinesData);
    setRecords(recordsData);
    setJobCards(jobCardsData);
    setIsLoading(false);
  };

  const handleSubmit = async (machineData) => {
    if (editingMachine) {
      await Machine.update(editingMachine.id, machineData);
    } else {
      await Machine.create(machineData);
    }
    setShowForm(false);
    setEditingMachine(null);
    loadData();
  };

  const handleEdit = (machine) => {
    setEditingMachine(machine);
    setShowForm(true);
  };

  const handleDelete = async (machineId) => {
    await Machine.delete(machineId);
    loadData();
  };

  const handleCreateServiceCard = (machine) => {
    sessionStorage.setItem('prefillServiceCardForMachineId', machine.id);
    navigate(createPageUrl('Services?action=create'));
  };

  // Removed handleServiceCardSubmit function

  const handlePrint = (machineId) => {
    const cardElementId = `machine-card-${machineId}`;
    const printStyle = document.createElement('style');
    printStyle.id = 'print-style-sheet';
    printStyle.innerHTML = `
        @media print {
            body > * {
                display: none !important;
            }
            .no-print {
                display: none !important;
            }
            #${cardElementId}, #${cardElementId} * {
                visibility: visible !important;
            }
            #${cardElementId} {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                page-break-inside: avoid;
                box-shadow: none !important;
                border: none !important;
                margin: 0;
                padding: 16px; /* Adjust padding as needed for print layout */
            }
        }
    `;
    document.head.appendChild(printStyle);
    window.print();
  };

  const getStatusStats = () => {
    const statsByStatus = machines.reduce((acc, machine) => {
      acc[machine.status] = (acc[machine.status] || 0) + 1;
      return acc;
    }, {});

    const needsServiceCount = machines.filter(machine => 
        machine.status === 'needs_service' || doesMachineNeedService(machine)
    ).length;

    return {
      operational: statsByStatus.operational || 0,
      not_in_use: statsByStatus.not_in_use || 0,
      maintenance: statsByStatus.maintenance || 0,
      needs_service: needsServiceCount,
      offline: statsByStatus.offline || 0,
    };
  };

  const statusStats = getStatusStats();

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Plant Management</h1>
            <p className="text-slate-600 mt-1">Monitor and manage your equipment inventory</p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-slate-800 hover:bg-slate-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Plant
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-2xl font-bold text-slate-900">{machines.length}</p>
                </div>
                <Settings className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600">Operational</p>
                  <p className="text-2xl font-bold text-emerald-600">{statusStats.operational || 0}</p>
                </div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
           <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Not In Use</p>
                  <p className="text-2xl font-bold text-slate-600">{statusStats.not_in_use || 0}</p>
                </div>
                <PauseCircle className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600">Maintenance</p>
                  <p className="text-2xl font-bold text-amber-600">{statusStats.maintenance || 0}</p>
                </div>
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Needs Service</p>
                  <p className="text-2xl font-bold text-red-600">{statusStats.needs_service || 0}</p>
                </div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white shadow-sm border-slate-200 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Select value={plantIdFilter} onValueChange={setPlantIdFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Plant #..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plant #s</SelectItem>
                    {machines.map(machine => (
                      machine.plant_id && (
                        <SelectItem key={machine.id} value={machine.plant_id}>
                          {machine.plant_id} - {machine.model}
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="not_in_use">Not In Use</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="needs_service">Needs Service</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
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
              <Select value={crewFilter} onValueChange={setCrewFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by crew" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crews</SelectItem>
                  {crewNames.map(crew => (
                      <SelectItem key={crew} value={crew}>{crew}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Service Card Form removed from here */}

        {/* Machine Form */}
        {showForm && (
          <MachineForm
            machine={editingMachine}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingMachine(null);
            }}
          />
        )}

        {/* Machine Grid */}
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
          ) : filteredMachines.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No plant found</p>
              <p className="text-slate-400">Try adjusting your filters or add a new plant</p>
            </div>
          ) : (
            filteredMachines.map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreateServiceCard={handleCreateServiceCard}
                onPrint={handlePrint}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
