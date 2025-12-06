
import React, { useState, useEffect, useMemo } from 'react';
import { WorkshopJobCard, Machine } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input'; // Import Input component
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { Plus, Loader2, Wrench, Search, Calendar as CalendarIcon } from 'lucide-react'; // Import Search icon and CalendarIcon
import JobCardForm from '../components/workshop/JobCardForm';
import JobCard from '../components/workshop/JobCard';

const operatorNames = [
    "Aaron Marsh", "Adam Schultz", "Adrian Beevor", "Andrew Clarke", "Andrew Walker", "Andy Billingsley",
    "Arleah Wearing", "Ashly Newman (Contractor)", "Ben Buschl", "Ben Nisbett", "Bevan Davies", "Bradley Bishell",
    "Bradley Mackel (Contractor)", "Brian Carter", "Bryan Heslop", "Bryce Renall-Cooper", "Callum Taylor",
    "Campbell Gibbs", "Charles Badcock", "Chole Fitzpatrick", "Chris Beard", "Chris Braden", "Christopher Jacobsen",
    "Chris Mead", "Chris Watene", "Connor Blackbourn", "Craig Roeske", "Craig Shepherd", "Craig Thorn",
    "Dalwyn Harwood", "Daniel Borck", "Darren Swan", "David Templeman", "Dennis Burnett", "Dominic Roberts",
    "Duncan McNicol", "Gene Gledhill-Munkowits", "Geoffrey Wratt", "George Robbins", "Isaak Guyton",
    "Jack Austin", "Jaden Roeske", "Jadyn Pezzack", "James Cory", "James Love", "Jared Rogers",
    "Jared Wadsworth", "Jared Van Der Laan", "Jeff Brooks", "Jeff Hamilton", "Jeff Hogg", "Jimmy Simpson",
    "Joan Lang", "Jonathon Musson", "Jorin Wells", "Josh Harrison - Hurring Foreman", "Karen Bryant",
    "Kieran Krammer", "Kieran Puklowski", "Kirk Pont", "Kim Bryant", "Liam Plaisier", "Leigh Puklowski",
    "Lenae Hope", "Malcolm Hopa", "Marie Davison", "Mark Brown", "Mark Pyers", "Martin Simpson",
    "Meilan Brown", "Michael Bartlett", "Mike Guyton", "Nicolas Taylor", "Nigel Bryant", "Nigel Hutchinson",
    "Oliver Dowding", "Paul Vass", "Peter Griffith", "Phill Nicholls", "Regan Wyatt", "Richard Herbert",
    "Richard Roughan", "Rob Mesman", "Robert Mesman (Senior)", "Robert Wearing", "Robin Ramsay",
    "Rodney Mear", "Russell Parkes", "Ryan Fisher", "Sam Newell", "Sam Roberts", "Sam Maclean",
    "Sandy Hemopo", "Scott Miller", "Sean Anderson", "Steve Austin", "Steven Biddulph", "Taine Vanstone",
    "Tanu Malietoa", "Tasman Vance", "Thomas Taane", "Timothy Manson", "Tyrone Wairau", "William Ching",
    "Zach Coote"
].sort();

const crewNames = ["BBC", "BGB", "Boar", "Boar Extra", "Bryant", "BSW", "Bull", "Chamois", "L9", "NBL", "Viking", "Stag", "Other"];

export default function WorkshopJobCardPage() {
    const [jobCards, setJobCards] = useState([]);
    const [machines, setMachines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [machineTypeFilter, setMachineTypeFilter] = useState("all");
    const [machineFilter, setMachineFilter] = useState("all");
    const [orderNumberSearch, setOrderNumberSearch] = useState(""); // New state for order number search
    const [jobNumberSearch, setJobNumberSearch] = useState(""); // New state for job number search
    const [startDateFilter, setStartDateFilter] = useState(null);
    const [endDateFilter, setEndDateFilter] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [cardsData, machinesData] = await Promise.all([
            WorkshopJobCard.list('-created_date'),
            Machine.list()
        ]);
        setJobCards(cardsData);
        setMachines(machinesData);
        setIsLoading(false);
    };

    const handleNewJobCardClick = async () => {
        setIsCreating(true);
        const allCards = await WorkshopJobCard.list();
        const jobNumbers = allCards
            .map(card => parseInt(card.job_number, 10))
            .filter(num => !isNaN(num));
        
        const maxJobNumber = jobNumbers.length > 0 ? Math.max(...jobNumbers) : 1000;
        const nextJobNumber = (maxJobNumber + 1).toString();

        const newCardTemplate = {
            job_number: nextJobNumber,
            machine_id: '',
            status: 'new',
            priority: 'medium',
            crew_name: '',
            reported_by: '',
            date_reported: new Date().toISOString(),
            fault_description: '',
            work_to_be_done: '',
            mechanic_assigned: '',
            parts_used: [],
            labour_hours: '',
            total_cost: '',
            completion_notes: '',
            date_completed: null,
        };

        setEditingCard(newCardTemplate);
        setShowForm(true);
        setIsCreating(false);
    };

    const handleFormSubmit = async (formData) => {
        if (editingCard && editingCard.id) { // Check for existing ID to differentiate update from initial create
            await WorkshopJobCard.update(editingCard.id, formData);
        } else {
            await WorkshopJobCard.create(formData);
        }
        setShowForm(false);
        setEditingCard(null);
        loadData();
    };

    const handleEdit = (card) => {
        setEditingCard(card);
        setShowForm(true);
    };
    
    const handleUpdate = async (cardId, data) => {
        await WorkshopJobCard.update(cardId, data);
        loadData();
    };

    const machineTypes = useMemo(() => {
        const types = new Set(machines.map(m => m.machine_type).filter(Boolean));
        return ['all', ...Array.from(types).sort()];
    }, [machines]);

    const filteredMachinesForSelect = useMemo(() => {
        if (machineTypeFilter === 'all') {
            return machines.sort((a,b) => (a.plant_id || '').localeCompare(b.plant_id || ''));
        }
        return machines.filter(m => m.machine_type === machineTypeFilter).sort((a,b) => (a.plant_id || '').localeCompare(b.plant_id || ''));
    }, [machines, machineTypeFilter]);

    const filteredJobCards = useMemo(() => {
        let filtered = jobCards;

        // 1. Filter by status
        if (statusFilter === 'all') {
            filtered = filtered.filter(card => card.status !== 'completed' && card.status !== 'invoiced');
        } else {
            filtered = filtered.filter(card => card.status === statusFilter);
        }

        // 2. Filter by machine
        if (machineFilter !== "all") {
             filtered = filtered.filter(card => card.machine_id === machineFilter);
        } else if (machineTypeFilter !== 'all') {
            const machineIdsOfType = filteredMachinesForSelect.map(m => m.id);
            filtered = filtered.filter(card => machineIdsOfType.includes(card.machine_id));
        }
        
        // 3. Filter by order number
        if (orderNumberSearch) {
            const lowercasedSearch = orderNumberSearch.toLowerCase();
            filtered = filtered.filter(card => 
                card.order_number && card.order_number.toLowerCase().includes(lowercasedSearch)
            );
        }

        // 4. Filter by job number
        if (jobNumberSearch) {
            filtered = filtered.filter(card => 
                card.job_number && card.job_number.includes(jobNumberSearch)
            );
        }

        // 5. Filter by date range
        if (startDateFilter) {
            filtered = filtered.filter(card => {
                if (!card.date_reported) return false;
                try {
                    const cardDate = parseISO(card.date_reported);
                    const startOfDayFilter = new Date(startDateFilter);
                    startOfDayFilter.setHours(0, 0, 0, 0); // Include the entire start day
                    return cardDate >= startOfDayFilter;
                } catch (e) { 
                    console.error("Error parsing date_reported for card (startDateFilter):", card.id, e);
                    return false; 
                }
            });
        }
        if (endDateFilter) {
            filtered = filtered.filter(card => {
                if (!card.date_reported) return false;
                try {
                    const cardDate = parseISO(card.date_reported);
                    const endOfDayFilter = new Date(endDateFilter);
                    endOfDayFilter.setHours(23, 59, 59, 999); // Include the entire end day
                    return cardDate <= endOfDayFilter;
                } catch (e) { 
                    console.error("Error parsing date_reported for card (endDateFilter):", card.id, e);
                    return false; 
                }
            });
        }

        return filtered;
    }, [jobCards, statusFilter, machineTypeFilter, machineFilter, orderNumberSearch, jobNumberSearch, startDateFilter, endDateFilter, filteredMachinesForSelect]); // Add date filters to dependencies

    const getMachineById = (id) => machines.find(m => m.id === id);

    return (
        <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Workshop Job Cards</h1>
                        <p className="text-slate-600 mt-1">Manage and track all workshop jobs.</p>
                    </div>
                    <Button onClick={handleNewJobCardClick} disabled={isCreating}>
                        {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        New Job Card
                    </Button>
                </div>

                {showForm && (
                    <JobCardForm
                        jobCard={editingCard}
                        machines={machines}
                        operatorNames={operatorNames}
                        crewNames={crewNames}
                        onSubmit={handleFormSubmit}
                        onCancel={() => { setShowForm(false); setEditingCard(null); }}
                    />
                )}

                {!showForm && (
                    <>
                        <Card className="bg-white shadow-sm border-slate-200 mb-6">
                            <CardContent className="p-4">
                                <div className="flex flex-wrap gap-4"> {/* Changed layout to flex flex-wrap for better responsiveness */}
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="flex-1 min-w-[180px]"> {/* Added flex-1 and min-w */}
                                            <SelectValue placeholder="Filter by status..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Open</SelectItem>
                                            <SelectItem value="new">New</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="invoiced">Invoiced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={machineTypeFilter} onValueChange={value => { setMachineTypeFilter(value); setMachineFilter("all"); }}>
                                        <SelectTrigger className="flex-1 min-w-[180px]"> {/* Added flex-1 and min-w */}
                                            <SelectValue placeholder="Filter by machine type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Machine Types</SelectItem>
                                            {machineTypes.map(type => (
                                                type !== 'all' && (
                                                <SelectItem key={type} value={type}>
                                                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </SelectItem>
                                                )
                                            ))}
                                        </SelectContent>
                                    </Select>
                                     <Select value={machineFilter} onValueChange={setMachineFilter}>
                                        <SelectTrigger className="flex-1 min-w-[180px]"> {/* Added flex-1 and min-w */}
                                          <SelectValue placeholder="Filter by machine..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="all">All Machines</SelectItem>
                                          {filteredMachinesForSelect.map(machine => (
                                            <SelectItem key={machine.id} value={machine.id}>
                                              {machine.plant_id} - {machine.model}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <div className="relative flex-1 min-w-[180px]"> {/* Order Number Search Input, added flex-1 and min-w */}
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                        <Input
                                            placeholder="Search by Order No..."
                                            value={orderNumberSearch}
                                            onChange={(e) => setOrderNumberSearch(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <div className="relative flex-1 min-w-[180px]"> {/* New Job Number Search Input, added flex-1 and min-w */}
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                        <Input
                                            placeholder="Search by Job No..."
                                            value={jobNumberSearch}
                                            onChange={(e) => setJobNumberSearch(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="flex-1 min-w-[180px] justify-start text-left font-normal text-slate-600">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {startDateFilter ? format(startDateFilter, 'PPP') : 'Reported After...'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={startDateFilter} onSelect={setStartDateFilter} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="flex-1 min-w-[180px] justify-start text-left font-normal text-slate-600">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {endDateFilter ? format(endDateFilter, 'PPP') : 'Reported Before...'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={endDateFilter} onSelect={setEndDateFilter} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </CardContent>
                        </Card>

                        {isLoading ? (
                            <div className="text-center py-12">
                                <Loader2 className="w-8 h-8 text-slate-400 mx-auto animate-spin mb-4" />
                                <p className="text-slate-500">Loading job cards...</p>
                            </div>
                        ) : filteredJobCards.length > 0 ? (
                            <div className="space-y-4">
                                {filteredJobCards.map(card => (
                                    <JobCard
                                        key={card.id}
                                        jobCard={card}
                                        machine={getMachineById(card.machine_id)}
                                        operatorNames={operatorNames}
                                        onEdit={() => handleEdit(card)}
                                        onUpdate={handleUpdate}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Card className="bg-white shadow-sm border-slate-200">
                                <CardContent className="p-12 text-center">
                                    <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-slate-700">No Job Cards Found</h3>
                                    <p className="text-slate-500 mt-2">There are no job cards matching the selected filter.</p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
