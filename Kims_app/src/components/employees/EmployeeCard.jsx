import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, User, Edit, Trash2 } from "lucide-react";

export default function EmployeeCard({ employee, isAdmin, onEdit, onDelete }) {
  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleConfig = (role) => {
    const configs = {
      admin: {
        label: "Admin",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: Shield,
      },
      manager: {
        label: "Manager",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Shield,
      },
      employee: {
        label: "Employee",
        color: "bg-slate-100 text-slate-800 border-slate-200",
        icon: User,
      }
    };
    return configs[role] || configs.employee;
  };

  const roleConfig = getRoleConfig(employee.role || 'employee');

  return (
    <Card className="bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">
              {getInitials(employee.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 truncate">
              {employee.full_name}
            </h3>
            <p className="text-sm text-slate-600 truncate">
              {employee.email}
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2 mb-4">
          <Badge className={`${roleConfig.color} border flex items-center gap-1`}>
            <roleConfig.icon className="w-3 h-3" />
            {roleConfig.label}
          </Badge>
        </div>

        {/* Created info */}
        {employee.created_at && (
          <p className="text-xs text-slate-500 mb-4">
            Added: {new Date(employee.created_at).toLocaleDateString()}
          </p>
        )}

        {/* Action Buttons - Only for admins */}
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(employee)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                if (confirm(`Delete ${employee.full_name}?`)) {
                  onDelete(employee.id);
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}