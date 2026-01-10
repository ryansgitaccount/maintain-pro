
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ClipboardCheck, 
  Clock, 
  Shield, 
  MapPin, 
  Wrench,
  Edit,
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Copy,
  Users // Added Users icon
} from "lucide-react";

export default function ChecklistCard({ 
  checklist, 
  onEdit, 
  onExecute, 
  onDelete,
  onDuplicate,
}) {
  return (
    <Card className="bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold text-slate-900 truncate">
              {checklist.name}
            </CardTitle>
            {checklist.crew_name && (
                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <Users className="w-4 h-4"/>
                    <span>{checklist.crew_name}</span>
                </div>
            )}
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
              {checklist.description}
            </p>
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDuplicate(checklist)}
              className="w-8 h-8"
              title="Duplicate checklist"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(checklist)}
              className="w-8 h-8"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(checklist.id)}
              className="w-8 h-8 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Machine Type */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {checklist.machine_type === 'all' ? 'All Machines' : checklist.machine_type?.replace('_', ' ')}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {checklist.maintenance_type?.replace('_', ' ')}
          </Badge>
        </div>

        {/* Task Count */}
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            <span>{checklist.tasks?.length || 0} tasks</span>
          </div>
        </div>

        {/* Safety Requirements Preview */}
        {checklist.safety_requirements && checklist.safety_requirements.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Safety Requirements</p>
            <p className="text-xs text-slate-600 truncate">
              {checklist.safety_requirements.slice(0, 2).join(', ')}
              {checklist.safety_requirements.length > 2 && ` +${checklist.safety_requirements.length - 2} more`}
            </p>
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={() => onExecute(checklist)}
          className="w-full bg-slate-800 hover:bg-slate-700 mt-4"
        >
          <Play className="w-4 h-4 mr-2" />
          Execute Checklist
        </Button>
      </CardContent>
    </Card>
  );
}
