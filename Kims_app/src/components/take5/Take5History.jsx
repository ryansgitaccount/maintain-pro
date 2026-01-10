
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, User, MapPin, Calendar, ClipboardList } from "lucide-react";
import { format } from "date-fns";

export default function Take5History({ records }) {
    return (
        <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                    <History className="w-5 h-5" />
                    Recent Take 5 Assessments
                </CardTitle>
            </CardHeader>
            <CardContent>
                {records.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No Take 5 records found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {records.map(record => (
                            <div key={record.id} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-slate-800">{record.task_description}</p>
                                    <Badge variant="outline">{format(new Date(record.completed_at), 'MMM d, yyyy')}</Badge>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" />
                                        <span>{record.operator_name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{record.location}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
