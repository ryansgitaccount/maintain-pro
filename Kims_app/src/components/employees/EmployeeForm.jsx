import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";
import { Crew } from "@/api/entities";

export default function EmployeeForm({ employee, isAdmin, onSubmit, onCancel }) {
  const [crews, setCrews] = useState([]);
  const [formData, setFormData] = useState(employee || {
    email: "",
    full_name: "",
    role: "employee",
    crew_id: ""
  });

  useEffect(() => {
    loadCrews();
  }, []);

  const loadCrews = async () => {
    try {
      const crewsList = await Crew.list('name');
      setCrews(crewsList);
    } catch (err) {
      console.error("Failed to load crews:", err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.email || !formData.full_name) {
      alert('Email and full name are required');
      return;
    }

    onSubmit(formData);
  };

  return (
    <Card className="bg-white shadow-lg border-slate-200 mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-900">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="employee@example.com"
                required
                disabled={!!employee} // Can't change email on edit
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          {/* Role - Only admins can change */}
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role || "employee"}
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Default role is Employee. Only admins can change roles.
              </p>
            </div>
          )}

          {!isAdmin && (
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="p-3 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {formData.role || 'employee'}
              </div>
              <p className="text-xs text-slate-500">Only admins can change roles</p>
            </div>
          )}

          {/* Crew Assignment */}
          <div className="space-y-2">
            <Label htmlFor="crew_id">Crew</Label>
            <Select
              value={formData.crew_id || ""}
              onValueChange={(value) => handleInputChange('crew_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a crew..." />
              </SelectTrigger>
              <SelectContent>
                {crews.map(crew => (
                  <SelectItem key={crew.id} value={crew.id}>
                    {crew.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <div className="border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit"
            className="bg-slate-800 hover:bg-slate-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {employee ? 'Update Employee' : 'Add Employee'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
