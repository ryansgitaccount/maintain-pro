
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Settings, Calendar, Wrench, Edit, Trash2, User, FileText, DollarSign, Gauge, Users as CrewIcon, Circle, CircleCheck, CircleHelp, Printer } from 'lucide-react';

export default function ServiceCardItem({ serviceCard, machine, onEdit, onDelete, onPrint }) {
    const serviceTypeColors = {
        '250hr': 'bg-blue-100 text-blue-800',
        '500hr': 'bg-green-100 text-green-800',
        '1000hr': 'bg-yellow-100 text-yellow-800',
        '2000hr': 'bg-orange-100 text-orange-800',
        'ad_hoc': 'bg-purple-100 text-purple-800',
        'repair': 'bg-red-100 text-red-800',
        'scheduled': 'bg-cyan-100 text-cyan-800'
    };

    const statusConfig = {
        open: {
            label: "Open",
            color: "bg-red-100 text-red-800",
            icon: Circle,
        },
        in_progress: {
            label: "In Progress",
            color: "bg-yellow-100 text-yellow-800",
            icon: Circle,
        },
        completed: {
            label: "Completed",
            color: "bg-green-100 text-green-800",
            icon: CircleCheck,
        },
    };

    const currentStatus = statusConfig[serviceCard.status] || {
        label: "Unknown",
        color: "bg-slate-100 text-slate-800",
        icon: CircleHelp,
    };
    
    const StatusIcon = currentStatus.icon;

    return (
        <Card id={`service-card-${serviceCard.id}`} className={`bg-white shadow-sm border-slate-200 w-full hover:shadow-md transition-shadow ${serviceCard.status === 'open' ? 'border-red-300' : 'border-slate-200'}`}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                        {(machine?.plant_id || serviceCard.plant_id) 
                            ? `Plant #: ${machine?.plant_id || serviceCard.plant_id}`
                            : machine?.model || 'Unknown Machine'
                        }
                    </CardTitle>
                    <p className="text-sm text-slate-500">{machine?.model || ''}</p>
                </div>
                <div className="flex items-center gap-2 no-print">
                     {serviceCard.service_type && (
                        <Badge className={serviceTypeColors[serviceCard.service_type] || 'bg-slate-100 text-slate-800'}>
                            {serviceCard.service_type}
                        </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="w-8 h-8 print-hidden" onClick={() => onPrint(serviceCard.id)}>
                        <Printer className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 print-hidden" onClick={() => onEdit(serviceCard)}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-600 print-hidden" onClick={() => onDelete(serviceCard.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                 <Badge className={`${currentStatus.color} border flex items-center gap-1.5 w-fit`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="font-semibold">{currentStatus.label}</span>
                </Badge>
                {serviceCard.service_date && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>{format(parseISO(serviceCard.service_date), 'MMM d, yyyy')}</span>
                    </div>
                )}
                {serviceCard.machine_hours_at_service && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Gauge className="w-4 h-4" />
                        <span>{serviceCard.machine_hours_at_service} hours</span>
                    </div>
                )}
                {serviceCard.serviced_by && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-4 h-4" />
                        <span>Serviced by {serviceCard.serviced_by}</span>
                    </div>
                )}
                {serviceCard.crew_name && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CrewIcon className="w-4 h-4" />
                        <span>Crew: {serviceCard.crew_name}</span>
                    </div>
                )}
                {serviceCard.work_description && (
                    <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100">
                        <p className="font-semibold text-slate-800">Work Performed</p>
                        <p className="mt-1 whitespace-pre-wrap">{serviceCard.work_description}</p>
                    </div>
                )}
                 {serviceCard.notes && (
                    <div className="text-sm text-slate-700 bg-blue-50 p-3 rounded-md border border-blue-100">
                        <p className="font-semibold text-blue-800">Notes</p>
                        <p className="mt-1 whitespace-pre-wrap">{serviceCard.notes}</p>
                    </div>
                )}
            </CardContent>
            {(serviceCard.labour_hours || serviceCard.total_cost) && (
                <CardFooter className="bg-slate-50/50 p-3 flex justify-end gap-4 text-sm">
                    {serviceCard.labour_hours && (
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Wrench className="w-4 h-4" />
                            <span>{serviceCard.labour_hours}h labour</span>
                        </div>
                    )}
                     {serviceCard.total_cost && (
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <DollarSign className="w-4 h-4" />
                            <span>${serviceCard.total_cost.toLocaleString()}</span>
                        </div>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
