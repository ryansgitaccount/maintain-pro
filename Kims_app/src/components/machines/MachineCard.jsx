
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  Clock,
  Gauge,
  FileText,
  PauseCircle,
  Users,
  ClipboardList,
  Printer // Added Printer icon
} from "lucide-react";
import { format } from "date-fns";

export default function MachineCard({ machine, onEdit, onDelete, onCreateServiceCard, onPrint }) { // Added onPrint prop
  const getStatusColor = (status) => {
    const colors = {
      operational: "bg-emerald-100 text-emerald-800 border-emerald-200",
      not_in_use: "bg-slate-100 text-slate-800 border-slate-200",
      maintenance: "bg-amber-100 text-amber-800 border-amber-200",
      offline: "bg-red-100 text-red-800 border-red-200",
      needs_service: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return colors[status] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getStatusIcon = (status) => {
    if (status === 'operational') return CheckCircle2;
    if (status === 'needs_service') return AlertTriangle;
    if (status === 'not_in_use') return PauseCircle;
    return Clock;
  };

  const StatusIcon = getStatusIcon(machine.status);

  const getHoursUntilService = () => {
    if (!machine.service_interval_hours || !machine.current_operating_hours) return null;
    const hoursUntilService = machine.service_interval_hours - (machine.current_operating_hours % machine.service_interval_hours);
    return hoursUntilService;
  };

  const getHoursSinceLastService = () => {
    if (!machine.last_service_hours || !machine.current_operating_hours) return null;
    return machine.current_operating_hours - machine.last_service_hours;
  };

  const hoursUntilService = getHoursUntilService();
  const hoursSinceLastService = getHoursSinceLastService();

  return (
    <Card id={`machine-card-${machine.id}`} className="bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow duration-200 flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold text-slate-900 truncate">
              {machine.plant_id}
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">{machine.model}</p>
            <p className="text-xs text-slate-500">{machine.manufacturer}</p>
            {machine.year && (
              <p className="text-xs text-slate-500">Year: {machine.year}</p>
            )}
            {machine.attachment && (
              <p className="text-xs text-slate-500">Attachment: {machine.attachment}</p>
            )}
          </div>
          <div className="flex gap-1 ml-2 no-print"> {/* Added no-print class */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPrint(machine.id)}
              className="w-8 h-8"
            >
              <Printer className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(machine)}
              className="w-8 h-8"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(machine.id)}
              className="w-8 h-8 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-grow">
        {/* Status */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={`${getStatusColor(machine.status)} border flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {machine.status.replace('_', ' ')}
          </Badge>
          {machine.crew_name && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {machine.crew_name}
            </Badge>
          )}
        </div>

        {/* Operating Hours */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Gauge className="w-4 h-4" />
          <span>{machine.current_operating_hours || 0} operating hours</span>
        </div>

        {/* Service Information */}
        <div className="space-y-2">
          {machine.last_service_date && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>Last service: {format(new Date(machine.last_service_date), 'MMM d, yyyy')}</span>
            </div>
          )}

          {machine.last_service_hours && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Settings className="w-4 h-4" />
              <span>Last serviced at {machine.last_service_hours} hours</span>
              {hoursSinceLastService !== null && (
                <span className="text-slate-500">({hoursSinceLastService}h ago)</span>
              )}
            </div>
          )}

          {hoursUntilService !== null && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Settings className="w-4 h-4" />
              <span>~{hoursUntilService}h until next service interval</span>
            </div>
          )}
        </div>
        
        {/* Notes Section */}
        {Array.isArray(machine.notes) && machine.notes.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FileText className="w-4 h-4" />
                    <span>Notes</span>
                </div>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-2">
                    {machine.notes
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((note, index) => (
                            <div key={index} className="text-sm text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
                                <p className="whitespace-pre-wrap">{note.note}</p>
                                <p className="text-xs text-slate-400 mt-1 text-right">
                                    {format(new Date(note.date), 'MMM d, yyyy, h:mm a')}
                                </p>
                            </div>
                        ))
                    }
                </div>
            </div>
        )}

        {/* Machine Type */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 uppercase tracking-wide">
            {machine.machine_type?.replace('_', ' ')} Equipment
          </span>
          {machine.plant_id && (
            <p className="text-xs text-slate-400 mt-1">Plant #: {machine.plant_id}</p>
          )}
          {machine.serial_number && (
            <p className="text-xs text-slate-400 mt-1">S/N: {machine.serial_number}</p>
          )}
          {machine.service_interval_hours && (
            <p className="text-xs text-slate-400 mt-1">Service every {machine.service_interval_hours} hours</p>
          )}
        </div>
      </CardContent>
      
      {/* Footer Actions */}
      <div className="p-4 pt-2 mt-auto no-print"> {/* Added no-print class */}
        <Button className="w-full" onClick={() => onCreateServiceCard(machine)}>
            <ClipboardList className="w-4 h-4 mr-2" />
            Service Card
        </Button>
      </div>

    </Card>
  );
}
