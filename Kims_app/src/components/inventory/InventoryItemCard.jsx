import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertTriangle, MapPin, Package, Hash, DollarSign, Building, Settings } from "lucide-react";

export default function InventoryItemCard({ item, machine, onEdit, onDelete }) {
  const isLowStock = item.quantity_on_hand <= (item.reorder_level || 0);

  return (
    <Card className={`bg-white shadow-sm border-slate-200 flex flex-col ${isLowStock ? 'border-amber-400' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-bold text-slate-900 truncate pr-2">
            {item.part_name}
          </CardTitle>
          <Badge variant={isLowStock ? 'destructive' : 'secondary'} className="whitespace-nowrap">
            {isLowStock && <AlertTriangle className="w-3 h-3 mr-1.5" />}
            {item.quantity_on_hand} in stock
          </Badge>
        </div>
        <p className="text-sm text-slate-500 flex items-center gap-2 pt-1">
          <Hash className="w-3 h-3"/>
          {item.part_number}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3 text-sm text-slate-700 flex-grow">
        {(item.machine_id || item.machine_type) && (
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-md border border-slate-100">
                <Settings className="w-4 h-4 text-slate-400" />
                <div>
                {machine && (
                    <p className="font-semibold text-slate-800">{machine.plant_id} - {machine.model}</p>
                )}
                {item.machine_type && (
                    <p className="text-xs text-slate-500">
                        {item.machine_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                )}
                </div>
            </div>
        )}
        {item.location && (
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{item.location}</span>
          </div>
        )}
        {item.supplier && (
           <div className="flex items-center gap-3">
            <Building className="w-4 h-4 text-slate-400" />
            <span>{item.supplier}</span>
          </div>
        )}
        {(item.cost_per_unit !== null && item.cost_per_unit > 0) && (
           <div className="flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span>${Number(item.cost_per_unit).toFixed(2)} per unit</span>
          </div>
        )}
        {item.notes && (
          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100 line-clamp-2">
            {item.notes}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="bg-white"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}