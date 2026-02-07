
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MaintenanceIssue, Machine, MaintenanceRecord, Employee, Crew } from '@/api/entities';
import IssueCard from '../components/maintenance/IssueCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle, Search, Users, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import IssuesByMachineChart from '../components/maintenance/IssuesByMachineChart';

export default function MaintenanceHubPage() {
    const [issues, setIssues] = useState([]);
    const [machines, setMachines] = useState([]);
    const [records, setRecords] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [crews, setCrews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('open');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [machineFilter, setMachineFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [crewFilter, setCrewFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadData();
        
        // Listen for when issues are created from the checklist
        const handleIssuesCreated = () => {
            loadData();
        };
        
        window.addEventListener('maintenance-issues-created', handleIssuesCreated);
        
        return () => {
            window.removeEventListener('maintenance-issues-created', handleIssuesCreated);
        };
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [issuesData, machinesData, recordsData, employeesData, crewsData] = await Promise.all([
            MaintenanceIssue.list('-created_date', 500),
            Machine.list(),
            MaintenanceRecord.list('-created_at', 1000),
            Employee.list(),
            Crew.list()
        ]);
        setIssues(issuesData);
        setMachines(machinesData);
        setRecords(recordsData);
        setEmployees(employeesData);
        setCrews(crewsData);
        setIsLoading(false);
    };

    const handleUpdateIssue = async (issueId, data) => {
        await MaintenanceIssue.update(issueId, data);
        // Optimistic update for faster UI response
        setIssues(prevIssues => prevIssues.map(issue => 
            issue.id === issueId ? { ...issue, ...data } : issue
        ));
        // Full reload to ensure data consistency
        loadData();
    };

    const getMachineById = useCallback((id) => machines.find(m => m.id === id), [machines]);

    const getRecordById = useCallback((id) => records.find(r => r.id === id), [records]);

    const filteredIssues = useMemo(() => {
        return issues
            .filter(issue => statusFilter === 'all' || issue.status === statusFilter)
            .filter(issue => priorityFilter === 'all' || issue.priority === priorityFilter)
            .filter(issue => machineFilter === 'all' || issue.machine_id === machineFilter)
            .filter(issue => {
                if (crewFilter === 'all') return true;
                // If issue has crew_name, use it.
                if (issue.crew_name) {
                    return issue.crew_name === crewFilter;
                }
                // Fallback: If issue doesn't have crew_name, find it from the original record.
                const originalRecord = getRecordById(issue.maintenance_record_id);
                return originalRecord?.crew_name === crewFilter;
            })
            .filter(issue => {
                if (!searchTerm) return true;
                const machine = getMachineById(issue.machine_id);
                const lowerSearchTerm = searchTerm.toLowerCase();
                return (
                    issue.title.toLowerCase().includes(lowerSearchTerm) ||
                    issue.description.toLowerCase().includes(lowerSearchTerm) ||
                    (machine && machine.plant_id && machine.plant_id.toLowerCase().includes(lowerSearchTerm))
                );
            })
            .filter(issue => {
                if (!startDate && !endDate) return true;
                const issueDate = new Date(issue.created_date);
                if (startDate && issueDate < new Date(startDate)) return false;
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (issueDate > end) return false;
                }
                return true;
            });
    }, [issues, statusFilter, priorityFilter, machineFilter, crewFilter, searchTerm, startDate, endDate, getMachineById, getRecordById]);
    
    return (
        <div className="p-4 sm:p-6 space-y-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Maintenance Hub</h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-1">Track and resolve all maintenance issues.</p>
                    </div>
                </div>

                <Card className="bg-white shadow-sm border-slate-200 mb-6">
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Issues Overview</h3>
                        <IssuesByMachineChart issues={issues} machines={machines} />
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-slate-200 mb-6">
                    <CardContent className="p-4">
                         <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <Input 
                                    placeholder="Search by title, description, or Plant #"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    placeholder="Start Date"
                                    className="w-full"
                                />
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    placeholder="End Date"
                                    className="w-full"
                                />
                            </div>
                            <Select value={crewFilter} onValueChange={setCrewFilter}>
                                <SelectTrigger className="w-full">
                                    <div className="flex items-center gap-2 text-slate-500">
                                      <Users className="w-4 h-4" />
                                      <SelectValue placeholder="Filter by crew..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Crews</SelectItem>
                                    {crews && crews.map(crew => (
                                        crew?.name && <SelectItem key={crew.id} value={crew.name}>{crew.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filter by status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filter by priority..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                             <Select value={machineFilter} onValueChange={setMachineFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filter by machine..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Machines</SelectItem>
                                    {machines && machines.sort((a,b) => (a.plant_id || '').localeCompare(b.plant_id || '')).filter(m => m.id).map(machine => (
                                        <SelectItem key={machine.id} value={machine.id}>
                                            {machine.plant_id} - {machine.model}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 text-slate-400 mx-auto animate-spin mb-4" />
                        <p className="text-slate-500">Loading maintenance issues...</p>
                    </div>
                ) : filteredIssues.length > 0 ? (
                    <div className="space-y-4">
                        {filteredIssues.map(issue => (
                            <IssueCard
                                key={issue.id}
                                issue={issue}
                                machine={getMachineById(issue.machine_id)}
                                operatorNames={employees.map(e => e.full_name).sort()}
                                onUpdate={handleUpdateIssue}
                            />
                        ))}
                    </div>
                ) : (
                     <Card className="bg-white shadow-sm border-slate-200">
                        <CardContent className="p-12 text-center">
                            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-700">No Issues Found</h3>
                            <p className="text-slate-500 mt-2">There are no maintenance issues matching the selected filters.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
