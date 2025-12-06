import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, User, HardHat, Wrench } from "lucide-react";

export default function EmployeeCard({ employee }) {
  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const typeConfig = {
    admin: {
      label: "Admin",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Shield,
    },
    operator: {
      label: "Operator",
      color: "bg-teal-100 text-teal-800 border-teal-200",
      icon: HardHat,
    },
    workshop_staff: {
      label: "Workshop Staff",
      color: "bg-indigo-100 text-indigo-800 border-indigo-200",
      icon: Wrench,
    },
    user: {
      label: "User",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: User,
    }
  };

  let classifications = [];
  if (employee.employee_types && employee.employee_types.length > 0) {
      classifications = [...employee.employee_types];
  }

  if (employee.role === 'admin' && !classifications.includes('admin')) {
      classifications.push('admin');
  }
  
  if (classifications.length === 0) {
      classifications.push('user');
  }

  // Ensure unique classifications
  classifications = [...new Set(classifications)];

  return (
    <Card className="bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6 flex items-center gap-4">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">
            {getInitials(employee.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 truncate">{employee.full_name}</h3>
          <p className="text-sm text-slate-500 truncate">{employee.email}</p>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            {classifications.map(classification => {
                const config = typeConfig[classification] || typeConfig.user;
                const RoleIcon = config.icon;
                return (
                    <Badge key={classification} className={`border text-xs capitalize ${config.color}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {config.label}
                    </Badge>
                );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}