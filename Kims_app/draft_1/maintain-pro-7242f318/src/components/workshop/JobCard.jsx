
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { Settings, Calendar, Wrench, Edit, User, Users, FileText } from 'lucide-react';

export default function JobCard({ jobCard, machine, operatorNames, onEdit, onUpdate }) {

    const statusConfig = {
        new: { label: "New", color: "bg-blue-100 text-blue-800" },
        in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
        awaiting_parts: { label: "Awaiting Parts", color: "bg-orange-100 text-orange-800" },
        completed: { label: "Completed", color: "bg-green-100 text-green-800" },
        invoiced: { label: "Invoiced", color: "bg-gray-100 text-gray-800" },
    };

    const priorityConfig = {
        low: { label: "Low", color: "bg-gray-200" },
        medium: { label: "Medium", color: "bg-yellow-200" },
        high: { label: "High", color: "bg-orange-200" },
        critical: { label: "Critical", color: "bg-red-200" },
    };

    return (
        <Card className="bg-white shadow-sm border-slate-200 w-full">
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                <div>
                    <CardTitle className="text-lg font-bold text-slate-900">Job #{jobCard.job_number}</CardTitle>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            <span>{machine?.plant_id || 'Unknown'} - {machine?.model || 'Machine'}</span>
                        </div>
                        {jobCard.crew_name && (
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>Crew: {jobCard.crew_name}</span>
                            </div>
                        )}
                        {jobCard.order_number && (
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span>Order: {jobCard.order_number}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Reported {jobCard.date_reported ? format(parseISO(jobCard.date_reported), 'MMM d, yyyy') : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={onEdit}>
                        <Edit className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100">
                    <p className="font-semibold text-slate-800">Fault Description</p>
                    <p className="mt-1">{jobCard.fault_description}</p>
                </div>
                {jobCard.work_to_be_done && (
                    <div className="text-sm text-slate-700 bg-blue-50 p-3 rounded-md border border-blue-100">
                        <p className="font-semibold text-blue-800">Work to be Done</p>
                        <p className="mt-1">{jobCard.work_to_be_done}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2">
                    <Select value={jobCard.status} onValueChange={(value) => onUpdate(jobCard.id, { status: value })}>
                        <SelectTrigger className={`w-40 h-8 text-xs font-semibold ${statusConfig[jobCard.status]?.color}`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={jobCard.priority} onValueChange={(value) => onUpdate(jobCard.id, { priority: value })}>
                        <SelectTrigger className={`w-32 h-8 text-xs font-semibold ${priorityConfig[jobCard.priority]?.color}`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(priorityConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <Select value={jobCard.mechanic_assigned || ""} onValueChange={(value) => onUpdate(jobCard.id, { mechanic_assigned: value })}>
                        <SelectTrigger className="w-[200px] bg-white">
                            <SelectValue placeholder="Assign mechanic..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={null}>Unassigned</SelectItem>
                            {operatorNames.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardFooter>
        </Card>
    );
}
