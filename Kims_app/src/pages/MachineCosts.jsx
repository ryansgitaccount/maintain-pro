import React, { useState, useEffect, useMemo } from 'react';
import { Machine, MaintenanceRecord, WorkshopJobCard, ServiceCard } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { DollarSign, Loader2 } from 'lucide-react';

const formatCurrency = (value) => {
    if (typeof value !== 'number') return '$0';
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function MachineCostsPage() {
    const [machines, setMachines] = useState([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [jobCards, setJobCards] = useState([]);
    const [serviceCards, setServiceCards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [machineTypeFilter, setMachineTypeFilter] = useState("all");
    const [machineFilter, setMachineFilter] = useState("all");
    const [sortBy, setSortBy] = useState("grandTotal");
    const [sortOrder, setSortOrder] = useState("desc");

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                const [machinesData, recordsData, jobsData, servicesData] = await Promise.all([
                    Machine.list(),
                    MaintenanceRecord.list(),
                    WorkshopJobCard.list(),
                    ServiceCard.list()
                ]);
                setMachines(machinesData);
                setMaintenanceRecords(recordsData);
                setJobCards(jobsData);
                setServiceCards(servicesData);
            } catch (error) {
                console.error("Failed to load cost data:", error);
            }
            setIsLoading(false);
        }
        loadData();
    }, []);

    const machineCostData = useMemo(() => {
        return machines.map(machine => {
            const maintenanceCost = maintenanceRecords
                .filter(r => r.machine_id === machine.id && r.cost > 0)
                .reduce((sum, r) => sum + r.cost, 0);
            
            const jobCardCost = jobCards
                .filter(j => j.machine_id === machine.id && j.total_cost > 0)
                .reduce((sum, j) => sum + j.total_cost, 0);

            const serviceCardCost = serviceCards
                .filter(s => s.machine_id === machine.id && s.total_cost > 0)
                .reduce((sum, s) => sum + s.total_cost, 0);

            const grandTotal = maintenanceCost + jobCardCost + serviceCardCost;

            return {
                ...machine,
                maintenanceCost,
                jobCardCost,
                serviceCardCost,
                grandTotal
            };
        });
    }, [machines, maintenanceRecords, jobCards, serviceCards]);

    const filteredCostData = useMemo(() => {
        let data = machineCostData;

        if (machineTypeFilter !== 'all') {
            data = data.filter(d => d.machine_type === machineTypeFilter);
        }
        if (machineFilter !== 'all') {
            data = data.filter(d => d.id === machineFilter);
        }

        if (sortOrder === 'asc') {
            return data.sort((a, b) => (a[sortBy] || 0) - (b[sortBy] || 0));
        } else {
            return data.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
        }
    }, [machineCostData, machineTypeFilter, machineFilter, sortBy, sortOrder]);

    const machineTypes = useMemo(() => {
        const types = new Set(machines.map(m => m.machine_type).filter(Boolean));
        return ['all', ...Array.from(types).sort()];
    }, [machines]);
    
    const chartData = useMemo(() => {
        return filteredCostData
            .filter(d => d.grandTotal > 0)
            .slice(0, 10)
            .map(d => ({ name: d.plant_id, total: d.grandTotal }))
            .sort((a, b) => a.total - b.total);
    }, [filteredCostData]);

    const totalFleetCost = useMemo(() => filteredCostData.reduce((sum, d) => sum + d.grandTotal, 0), [filteredCostData]);
    const averageCost = totalFleetCost > 0 && filteredCostData.length > 0 ? totalFleetCost / filteredCostData.length : 0;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <Loader2 className="w-12 h-12 text-slate-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Machine Costs Analysis</h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-1">An overview of all costs associated with your machinery.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Fleet Cost</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalFleetCost)}</div>
                            <p className="text-xs text-muted-foreground">Across {filteredCostData.length} machines</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Cost per Machine</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(averageCost)}</div>
                             <p className="text-xs text-muted-foreground">Based on current filters</p>
                        </CardContent>
                    </Card>
                </div>
                
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Top 10 Machines by Total Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tickFormatter={formatCurrency} />
                                <YAxis type="category" dataKey="name" width={80} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }} formatter={formatCurrency} />
                                <Bar dataKey="total" fill="#334155" barSize={30}>
                                    <LabelList dataKey="total" position="right" formatter={formatCurrency} className="text-sm font-semibold" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Cost Breakdown</CardTitle>
                        <div className="flex flex-col md:flex-row gap-4 pt-4">
                            <Select value={machineTypeFilter} onValueChange={setMachineTypeFilter}>
                                <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Filter by type..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Machine Types</SelectItem>
                                    {machineTypes.map(type => type !== 'all' && (
                                        <SelectItem key={type} value={type}>
                                            {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={machineFilter} onValueChange={setMachineFilter}>
                                <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Filter by machine..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Machines</SelectItem>
                                    {filteredCostData.map(m => <SelectItem key={m.id} value={m.id}>{m.plant_id} - {m.model}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Sort by..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="grandTotal">Total Cost</SelectItem>
                                    <SelectItem value="maintenanceCost">Maintenance Cost</SelectItem>
                                    <SelectItem value="jobCardCost">Job Card Cost</SelectItem>
                                    <SelectItem value="serviceCardCost">Service Card Cost</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sortOrder} onValueChange={setSortOrder}>
                                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Sort order..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="asc">Lowest to Highest</SelectItem>
                                    <SelectItem value="desc">Highest to Lowest</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plant ID</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead className="text-right">Maintenance Cost</TableHead>
                                    <TableHead className="text-right">Job Card Cost</TableHead>
                                    <TableHead className="text-right">Service Card Cost</TableHead>
                                    <TableHead className="text-right font-bold">Total Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCostData.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.plant_id}</TableCell>
                                        <TableCell>{item.model}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.maintenanceCost)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.jobCardCost)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.serviceCardCost)}</TableCell>
                                        <TableCell className="text-right font-bold text-slate-800">{formatCurrency(item.grandTotal)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {filteredCostData.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                No cost data available for the selected filters.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}