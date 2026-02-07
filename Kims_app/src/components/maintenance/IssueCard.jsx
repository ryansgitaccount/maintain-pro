
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { AlertTriangle, ChevronDown, CheckCircle, Clock, Settings, User, Save, Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/useToast";
import { Label } from "@/components/ui/label";

export default function IssueCard({ issue, machine, operatorNames, onUpdate }) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [runningNotes, setRunningNotes] = useState(issue.running_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Update runningNotes state if the issue.running_notes prop changes
    // This is crucial to keep the Textarea in sync when the parent updates the issue object
    setRunningNotes(issue.running_notes || '');
  }, [issue.running_notes]);

  const priorityConfig = {
    low: { label: "Low", color: "border-blue-500", badge: "bg-blue-100 text-blue-800" },
    medium: { label: "Medium", color: "border-yellow-500", badge: "bg-yellow-100 text-yellow-800" },
    high: { label: "High", color: "border-orange-500", badge: "bg-orange-100 text-orange-800" },
    critical: { label: "Critical", color: "border-red-500", badge: "bg-red-100 text-red-800" },
  };

  const statusConfig = {
    open: { label: "Open", badge: "bg-gray-200 text-gray-800" },
    in_progress: { label: "In Progress", badge: "bg-blue-200 text-blue-800" },
    resolved: { label: "Resolved", badge: "bg-green-200 text-green-800" },
  };

  const currentPriority = priorityConfig[issue.priority] || priorityConfig.low;
  const currentStatus = statusConfig[issue.status] || statusConfig.open;

  const handleResolve = () => {
    onUpdate(issue.id, {
      status: 'resolved',
      resolution_notes: resolutionNotes,
      resolved_at: new Date().toISOString()
    });
    setIsResolving(false);
  };

  const handleSaveNotes = async () => {
    if (runningNotes === (issue.running_notes || '')) return; // Only save if notes have actually changed
    setIsSavingNotes(true);
    await onUpdate(issue.id, { running_notes: runningNotes });
    setIsSavingNotes(false);
    toast({
        title: "Notes Saved",
        description: "Your running notes have been updated.",
        variant: "success",
    });
  };
  
  return (
    <Card className={`bg-white shadow-sm border-l-4 ${currentPriority.color} w-full`}>
      <CardHeader className="space-y-4 pb-3">
        <div className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800">{issue.title}</CardTitle>
            <p className="text-sm text-slate-500">
              For Machine: <span className="font-medium text-slate-700">{machine?.unit_number || 'Unknown'}</span>
            </p>
            {issue.crew_name && (
              <p className="text-sm text-slate-500">
                  Crew: <span className="font-medium text-slate-700">{issue.crew_name}</span>
              </p>
            )}
          </div>
        </div>
        
        {/* Status and Priority Selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`status-${issue.id}`} className="text-xs font-semibold text-slate-700">Status</Label>
            <Select value={issue.status || 'open'} onValueChange={(value) => onUpdate(issue.id, { status: value })}>
              <SelectTrigger id={`status-${issue.id}`} className="bg-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor={`priority-${issue.id}`} className="text-xs font-semibold text-slate-700">Priority</Label>
            <Select value={issue.priority || 'medium'} onValueChange={(value) => onUpdate(issue.id, { priority: value })}>
              <SelectTrigger id={`priority-${issue.id}`} className="bg-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100">
                    <Label className="font-semibold text-slate-800">Issue Description</Label>
                    <p className="mt-1">{issue.description}</p>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor={`running-notes-${issue.id}`} className="font-semibold text-slate-800">Running Notes</Label>
                <Textarea
                    id={`running-notes-${issue.id}`}
                    placeholder="Add ongoing updates here..."
                    value={runningNotes}
                    onChange={(e) => setRunningNotes(e.target.value)}
                    className="min-h-[120px] bg-white"
                />
                <Button onClick={handleSaveNotes} size="sm" disabled={isSavingNotes || runningNotes === (issue.running_notes || '')}>
                    {isSavingNotes ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Notes
                </Button>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 bg-slate-50/50 p-4">
        <div className="space-y-2 w-full">
          <Label htmlFor={`assigned-${issue.id}`} className="text-sm font-semibold text-slate-700">Assigned To</Label>
          <Select value={issue.assigned_to || ""} onValueChange={(value) => onUpdate(issue.id, { assigned_to: value || null })}>
            <SelectTrigger id={`assigned-${issue.id}`} className="bg-white">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {operatorNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {!isResolving ? (
          <Button onClick={() => setIsResolving(true)} variant="secondary" className="w-full">
            <Check className="w-4 h-4 mr-2" />
            Resolve Issue
          </Button>
        ) : (
          <div className="w-full flex flex-col gap-2">
            <Textarea 
              placeholder="Add resolution notes..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="bg-white"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsResolving(false)}>Cancel</Button>
              <Button size="sm" onClick={handleResolve} disabled={!resolutionNotes}>
                <Save className="w-4 h-4 mr-2"/>
                Save Resolution
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
