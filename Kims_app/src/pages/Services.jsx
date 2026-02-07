
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Machine, ServiceCard } from "@/api/entities"; // Ensure ServiceCard is exported from entities/all
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart as BarChartIcon, Plus, FileText, Users, Wrench } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useToast } from "@/components/ui/useToast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import ServiceCardForm from "../components/services/ServiceCardForm";
import ServiceCardItem from "../components/services/ServiceCardItem";

export default function Services() {
  const [machines, setMachines] = useState([]);
  const [serviceCards, setServiceCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [selectedCrew, setSelectedCrew] = useState("all");
  const [selectedMachine, setSelectedMachine] = useState("all");
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [machineData, cardData] = await Promise.all([
            Machine.list('-updated_at'),
            ServiceCard.list('-service_date'),
        ]);
        setMachines(machineData);
        setServiceCards(cardData);
    } catch (error) {
        console.error("Failed to load data", error);
        toast({ title: "Error", description: "Could not load services data.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);
  
  useEffect(() => {
    loadData().then(() => {
        // This runs after machines are loaded
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'create') {
            const machineIdToPrefill = sessionStorage.getItem('prefillServiceCardForMachineId');
            if (machineIdToPrefill) {
                // Ensure date is in ISO format for the date picker
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
                const day = String(today.getDate()).padStart(2, '0');
                const isoDate = `${year}-${month}-${day}`;

                setEditingCard({ machine_id: machineIdToPrefill, service_date: isoDate });
                setShowForm(true);
                sessionStorage.removeItem('prefillServiceCardForMachineId');

                // Clean up URL
                const url = new URL(window.location);
                url.searchParams.delete('action');
                window.history.replaceState({}, '', url);
            }
        }
    });

    // Listen for the custom event dispatched from the layout
    window.addEventListener('service-cards-created', loadData);
    
    const handleAfterPrint = () => {
        const printStyle = document.getElementById('print-style-sheet');
        if (printStyle) {
            printStyle.remove();
        }
    };
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('service-cards-created', loadData);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [loadData]);
  
  const handleFormSubmit = async (formData) => {
    try {
        const machine = machines.find(m => m.id === formData.machine_id);
        const dataToSubmit = { ...formData, status: 'completed', plant_id: machine?.plant_id }; // Changed from unit_number

        // Find the crew_name from the selected machine to include in the service card data
        const selectedMachine = machines.find(m => m.id === formData.machine_id);
        if (selectedMachine && selectedMachine.crew_name) {
            dataToSubmit.crew_name = selectedMachine.crew_name;
        }

        if (editingCard) {
            await ServiceCard.update(editingCard.id, dataToSubmit);
            toast({ title: "Success", description: "Service card updated." });
        } else {
            await ServiceCard.create(dataToSubmit);
            toast({ title: "Success", description: "Service card created." });
        }

        // Update the corresponding machine's service details if relevant fields are present
        if (formData.service_date && formData.machine_hours_at_service) {
            await Machine.update(formData.machine_id, {
                last_service_date: formData.service_date,
                last_service_hours: formData.machine_hours_at_service
            });
            toast({ title: "Machine Updated", description: "Machine service history has been updated." });
        }

        setShowForm(false);
        setEditingCard(null);
        loadData();
    } catch (error) {
        console.error("Failed to submit form:", error);
        toast({ title: "Error", description: "Failed to save service card.", variant: "destructive" });
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (cardId) => {
      if (window.confirm("Are you sure you want to delete this service card?")) {
          try {
              await ServiceCard.delete(cardId);
              toast({ title: "Success", description: "Service card deleted." });
              loadData();
          } catch(error) {
              console.error("Failed to delete service card:", error);
              toast({ title: "Error", description: "Failed to delete service card.", variant: "destructive" });
          }
      }
  };

  const handlePrint = (cardId) => {
    const cardElementId = `service-card-${cardId}`;
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
                margin: 0 !important;
                padding: 20px !important;
                box-shadow: none !important;
                border: none !important;
            }
            /* Ensure text color is black for printing */
            #${cardElementId} p, #${cardElementId} span, #${cardElementId} h1, #${cardElementId} h2, #${cardElementId} h3, #${cardElementId} h4, #${cardElementId} h5, #${cardElementId} h6 {
              color: black !important;
            }
            /* Hide any print buttons within the printed card itself */
            #${cardElementId} .print-hidden {
              display: none !important;
            }
        }
    `;
    document.head.appendChild(printStyle);
    window.print();
  };

  const allCrews = useMemo(() => {
    const machineCrews = machines.map(m => m.crew_name);
    const serviceCardCrews = serviceCards.map(sc => sc.crew_name);
    const combinedCrews = [...machineCrews, ...serviceCardCrews];
    const uniqueCrews = new Set(combinedCrews.filter(Boolean));
    return Array.from(uniqueCrews).sort();
  }, [machines, serviceCards]);

  const machineServiceHoursData = useMemo(() => {
    return machines
      .filter(machine => selectedCrew === 'all' || machine.crew_name === selectedCrew)
      .filter(machine => selectedMachine === 'all' || machine.id === selectedMachine)
      .filter(machine => machine.service_interval_hours && typeof machine.current_operating_hours === 'number')
      .map(machine => {
        const lastService = machine.last_service_hours || 0;
        const nextServiceHours = lastService + machine.service_interval_hours;
        const hoursUntilService = nextServiceHours - machine.current_operating_hours;

        let fill;
        if (hoursUntilService <= 0) {
          fill = '#ef4444'; // Red for overdue
        } else if (hoursUntilService <= 100) {
          fill = '#f97316'; // Orange for 0-100 hrs remaining
        } else {
          fill = '#22c56e'; // Green for > 100 hrs remaining, changed from #22c5e to a valid hex
        }
        
        return {
          name: machine.plant_id, // Changed from unit_number
          hours: hoursUntilService,
          fill: fill
        };
      })
      .sort((a, b) => a.hours - b.hours)
      .slice(0, 20); // Show only top 20 closest to needing service
  }, [machines, selectedCrew, selectedMachine]);
  
  const getMachineById = (id) => machines.find(m => m.id === id);

  const filteredServiceCards = useMemo(() => {
    let filtered = serviceCards;

    if (selectedCrew !== 'all') {
        // Filter service cards directly by their crew_name property
        filtered = filtered.filter(card => card.crew_name === selectedCrew);
    }
    
    if (selectedMachine !== 'all') {
        filtered = filtered.filter(card => card.machine_id === selectedMachine);
    }
    
    return filtered;
  }, [selectedCrew, selectedMachine, serviceCards]);


  return (
    <div className="p-4 sm:p-6 space-y-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Services</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">View machine service status and manage service records.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
             <Select value={selectedCrew} onValueChange={setSelectedCrew}>
                <SelectTrigger className="w-full sm:w-auto">
                    <Users className="w-4 h-4 mr-2 text-slate-500" />
                    <SelectValue placeholder="Filter by crew..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Crews</SelectItem>
                    {allCrews.map(crew => (
                        <SelectItem key={crew} value={crew}>
                            {crew}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                <SelectTrigger className="w-full sm:w-auto">
                    <Wrench className="w-4 h-4 mr-2 text-slate-500" />
                    <SelectValue placeholder="Filter by Plant #..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Plant #</SelectItem>
                    {machines.sort((a,b) => (a.plant_id || '').localeCompare(b.plant_id || '')).map(machine => (
                        <SelectItem key={machine.id} value={machine.id}>
                            {machine.plant_id} - {machine.model}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button onClick={() => { setEditingCard(null); setShowForm(true); }} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create Service Card
            </Button>
          </div>
        </div>

        {showForm && (
            <ServiceCardForm 
                serviceCard={editingCard}
                machines={machines.sort((a, b) => (a.plant_id || '').localeCompare(b.plant_id || ''))} // Changed from unit_number
                onSubmit={handleFormSubmit}
                onCancel={() => { setShowForm(false); setEditingCard(null); }}
            />
        )}

        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <BarChartIcon className="w-5 h-5" />
              Upcoming Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="h-[350px] flex items-center justify-center">
                    <p className="text-slate-500">Loading chart data...</p>
                </div>
            ) : machineServiceHoursData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={machineServiceHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" angle={-45} textAnchor="end" height={100} interval={0} tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => {
                       const roundedValue = Math.round(value);
                       const label = roundedValue <= 0 ? 'Overdue' : 'Due in';
                       return [`${Math.abs(roundedValue)} hrs`, label];
                    }}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {machineServiceHoursData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-[350px] flex items-center justify-center">
                    <p className="text-slate-500">No machine service data for the selected filter.</p>
                </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Service History
                </h2>
            </div>
            {isLoading ? (
                <p className="text-slate-500">Loading service history...</p>
            ) : filteredServiceCards.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredServiceCards.map(card => (
                        <ServiceCardItem 
                            key={card.id}
                            serviceCard={card}
                            machine={getMachineById(card.machine_id)}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onPrint={handlePrint}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                    <p className="text-slate-500">
                        {selectedCrew === 'all' && selectedMachine === 'all'
                            ? "No service cards have been created yet." 
                            : `No service history found for the selected filter.`}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
