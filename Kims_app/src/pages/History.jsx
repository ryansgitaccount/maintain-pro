
import React, { useState, useEffect, useMemo } from "react";
import { MaintenanceRecord, Machine, MaintenanceIssue } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  History,
  Search,
  Settings,
  Calendar,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Users,
  Check,
  FileText // Added FileText icon
} from "lucide-react";
import { format, parseISO } from "date-fns";
import IssuesTimeline from '../components/history/IssuesTimeline';

const RecordCard = ({ record, machinePlantId }) => {
  const getTypeColor = (type) => {
    const colors = {
      routine: "bg-blue-100 text-blue-800 border-blue-200",
      preventive: "bg-green-100 text-green-800 border-green-200",
      corrective: "bg-amber-100 text-amber-800 border-amber-200",
      emergency: "bg-red-100 text-red-800 border-red-200",
      inspection: "bg-purple-100 text-purple-800 border-purple-200"
    };
    return colors[record.maintenance_type] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  const hasIssues = record.issues_found && record.issues_found.trim().length > 0;

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg font-bold text-slate-900">Plant # {machinePlantId}</CardTitle>
                <p className="text-sm text-slate-500">Serviced by {record.operator_name}</p>
                {record.crew_name && (
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <Users className="w-3 h-3"/>
                        <span>{record.crew_name}</span>
                    </div>
                )}
            </div>
            <Badge className={`${getTypeColor(record.maintenance_type)} border text-xs`}>
              {record.maintenance_type}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4" />
          <span>{format(parseISO(record.completed_at || record.created_at), 'MMM d, yyyy, h:mm a')}</span>
        </div>
        {record.cost > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
                <DollarSign className="w-4 h-4" />
                <span>Cost: ${record.cost.toLocaleString()}</span>
            </div>
        )}
        {record.duration_minutes > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
                <Wrench className="w-4 h-4" />
                <span>Duration: {record.duration_minutes} minutes</span>
            </div>
        )}
        <div className={`p-3 rounded-md ${hasIssues ? 'bg-amber-50 border border-amber-100' : 'bg-green-50 border border-green-100'}`}>
            <div className={`flex items-center gap-2 font-medium ${hasIssues ? 'text-amber-800' : 'text-green-800'}`}>
                {hasIssues ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{hasIssues ? "Issues Found" : "No Major Issues"}</span>
            </div>
            {record.issues_found && <p className="text-sm text-amber-700 mt-1">{record.issues_found}</p>}
            {record.recommendations && <p className="text-sm text-slate-600 mt-1"><strong>Recommendations:</strong> {record.recommendations}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const ResolvedIssueCard = ({ issue, machine }) => {
  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg font-bold text-slate-900">{issue.title}</CardTitle>
                <p className="text-sm text-slate-500">Plant # {machine?.plant_id || 'Unknown Machine'}</p>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200 border text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Resolved
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {issue.resolved_date && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>Resolved on {format(parseISO(issue.resolved_date), 'MMM d, yyyy')}</span>
          </div>
        )}
        {issue.assigned_to && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="w-4 h-4" />
            <span>Resolved by {issue.assigned_to}</span>
          </div>
        )}
        <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
            <p className="text-sm text-slate-600"><strong>Original Issue:</strong> {issue.description}</p>
            <p className="text-sm text-slate-800 mt-2"><strong>Resolution:</strong> {issue.resolution_notes}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const NotesHistory = ({ notes }) => {
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No notes found for this machine.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pt-6">
            {notes
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((note, index) => (
                    <Card key={index} className="bg-white shadow-sm border-slate-200">
                        <CardContent className="p-4">
                            <p className="whitespace-pre-wrap text-slate-800">{note.note}</p>
                            <p className="text-xs text-slate-500 mt-2 text-right">
                                {format(new Date(note.date), 'MMM d, yyyy, h:mm a')}
                            </p>
                        </CardContent>
                    </Card>
                ))
            }
        </div>
    );
};


export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [machines, setMachines] = useState([]);
  const [issues, setIssues] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [machineFilter, setMachineFilter] = useState("all");
  const [machineTypeFilter, setMachineTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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

  useEffect(() => {
    const machineIdsOfType = filteredMachinesForSelect.map(m => m.id);

    // Filter Maintenance Records
    let recFiltered = records;
    if (machineFilter !== "all") {
      recFiltered = recFiltered.filter(record => record.machine_id === machineFilter);
    } else if (machineTypeFilter !== 'all') {
      recFiltered = recFiltered.filter(record => machineIdsOfType.includes(record.machine_id));
    }
    setFilteredRecords(recFiltered);

    // Filter Resolved Issues
    let issFiltered = issues.filter(i => i.status === 'resolved'); // This filter is redundant due to loadData, but harmless
    if (machineFilter !== "all") {
        issFiltered = issFiltered.filter(issue => issue.machine_id === machineFilter);
    } else if (machineTypeFilter !== 'all') {
        issFiltered = issFiltered.filter(issue => machineIdsOfType.includes(issue.machine_id));
    }
    setFilteredIssues(issFiltered);

  }, [records, issues, machineFilter, machineTypeFilter, filteredMachinesForSelect]);

  const loadData = async () => {
    setIsLoading(true);
    const [recordsData, machinesData, issuesData] = await Promise.all([
      MaintenanceRecord.list('-created_at'),
      Machine.list(),
      MaintenanceIssue.list('-resolved_date')
    ]);
    setRecords(recordsData);
    setMachines(machinesData);
    setIssues(issuesData.filter(i => i.status === 'resolved' && i.resolved_date)); // Ensure issues are resolved and have a date
    setIsLoading(false);
  };

  const getMachineInfo = (machineId) => {
    return machines.find(m => m.id === machineId);
  };

  const selectedMachine = useMemo(() => {
    if (machineFilter === 'all') return null;
    return machines.find(m => m.id === machineFilter);
  }, [machineFilter, machines]);

  return (
    <div className="p-4 sm:p-6 space-y-8 bg-slate-50 w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Maintenance History</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">Review all completed maintenance records and resolved issues</p>
          </div>
        </div>

        <Card className="bg-white shadow-sm border-slate-200 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Select value={machineTypeFilter} onValueChange={value => { setMachineTypeFilter(value); setMachineFilter("all"); }}>
                <SelectTrigger className="w-full sm:w-auto">
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by machine..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Machines</SelectItem>
                  {filteredMachinesForSelect.map(machine => (
                    <SelectItem key={machine.id} value={machine.id}>
                      Plant # {machine.plant_id} - {machine.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="records" className="w-full">
            <TabsList className="grid w-full grid-cols-4"> {/* Changed to grid-cols-4 */}
                <TabsTrigger value="records">Checklist History</TabsTrigger>
                <TabsTrigger value="issues">Resolved Issues</TabsTrigger>
                <TabsTrigger value="timeline">Issue Timeline</TabsTrigger>
                <TabsTrigger value="notes">Machine Notes</TabsTrigger> {/* Added new tab */}
            </TabsList>
            <TabsContent value="records">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                  {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader><div className="h-6 bg-slate-200 rounded w-3/4"></div></CardHeader>
                        <CardContent className="space-y-3">
                          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                          <div className="h-4 bg-slate-200 rounded w-full"></div>
                          <div className="h-10 bg-slate-200 rounded w-full"></div>
                        </CardContent>
                      </Card>
                    ))
                  ) : filteredRecords.length > 0 ? (
                    filteredRecords.map(record => (
                      <RecordCard
                        key={record.id}
                        record={record}
                        machinePlantId={getMachineInfo(record.machine_id)?.plant_id || "Unknown"}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 text-lg">No checklist records found</p>
                      <p className="text-slate-400">Try adjusting your filters.</p>
                    </div>
                  )}
                </div>
            </TabsContent>
            <TabsContent value="issues">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                  {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader><div className="h-6 bg-slate-200 rounded w-3/4"></div></CardHeader>
                        <CardContent className="space-y-3">
                          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                          <div className="h-10 bg-slate-200 rounded w-full"></div>
                        </CardContent>
                      </Card>
                    ))
                  ) : filteredIssues.length > 0 ? (
                    filteredIssues.map(issue => (
                      <ResolvedIssueCard
                        key={issue.id}
                        issue={issue}
                        machine={getMachineInfo(issue.machine_id)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <Check className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 text-lg">No resolved issues found</p>
                      <p className="text-slate-400">Try adjusting your filters.</p>
                    </div>
                  )}
                </div>
            </TabsContent>
            <TabsContent value="timeline">
              <IssuesTimeline issues={filteredIssues} machines={machines} />
            </TabsContent>
            <TabsContent value="notes"> {/* New TabsContent for notes */}
                {selectedMachine ? (
                    <NotesHistory notes={selectedMachine.notes} />
                ) : (
                    <div className="col-span-full text-center py-12">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">Select a Specific Machine</p>
                        <p className="text-slate-400">Please choose a machine from the filter above to view its notes.</p>
                    </div>
                )}
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
