
import React, { useState, useEffect } from "react";
import { Employee } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Shield, Search, Plus } from "lucide-react";
import { useToast } from "@/components/ui/useToast";
import EmployeeCard from "../components/employees/EmployeeCard";
import EmployeeForm from "../components/employees/EmployeeForm";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole("employee");
        return;
      }

      // Query employees table for the current user's role
      const { data: employee, error } = await supabase
        .from("employees")
        .select("role")
        .eq("email", user.email)
        .single();

      if (error || !employee) {
        // User not in employees table, default to employee role
        setUserRole("employee");
      } else {
        setUserRole(employee.role);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setUserRole("employee");
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load employees from employees table
      const employeesList = await Employee.list();
      setEmployees(employeesList || []);
    } catch (err) {
      console.error("Failed to load employees:", err);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = employees;
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = employees.filter(emp =>
        (emp.full_name?.toLowerCase().includes(lowercasedTerm) ||
        emp.email?.toLowerCase().includes(lowercasedTerm))
      );
    }
    setFilteredEmployees(filtered);
  }, [employees, searchTerm]);

  const isAdmin = userRole === "admin";

  const stats = {
    total: employees.length,
    admins: employees.filter(e => e.role === "admin").length,
    managers: employees.filter(e => e.role === "manager").length
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEdit = (employee) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only admins can edit employees",
        variant: "destructive"
      });
      return;
    }
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = async (employeeId) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only admins can delete employees",
        variant: "destructive"
      });
      return;
    }

    try {
      await Employee.delete(employeeId);
      toast({
        title: "Success",
        description: "Employee deleted successfully"
      });
      loadData();
    } catch (err) {
      console.error("Failed to delete employee:", err);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive"
      });
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingEmployee) {
        await Employee.update(editingEmployee.id, formData);
        toast({
          title: "Success",
          description: "Employee updated successfully"
        });
      } else {
        await Employee.create(formData);
        toast({
          title: "Success",
          description: "Employee created successfully"
        });
      }
      setShowForm(false);
      setEditingEmployee(null);
      loadData();
    } catch (err) {
      console.error("Failed to save employee:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to save employee",
        variant: "destructive"
      });
    }
  };

  const handleConvertToEmployee = async (authUser) => {
    try {
      await Employee.create({
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split("@")[0],
        role: "employee"
      });
      toast({
        title: "Success",
        description: `${authUser.email} converted to employee`
      });
      loadData();
    } catch (err) {
      console.error("Error converting user:", err);
      toast({
        title: "Error",
        description: "Failed to convert user",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
            <p className="text-slate-600 mt-1">
              {isAdmin ? "Manage your team members" : "View employees"}
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={handleAdd}
              className="bg-slate-800 hover:bg-slate-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Employees</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Admins</p>
                  <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
                </div>
                <Shield className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Managers</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.managers}</p>
                </div>
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-white shadow-sm border-slate-200 mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        {showForm && (
          <EmployeeForm
            employee={editingEmployee}
            isAdmin={isAdmin}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingEmployee(null);
            }}
          />
        )}

        {/* Employees Grid */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Active Employees ({filteredEmployees.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="bg-white shadow-sm border-slate-200 animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded"></div>
                          <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-slate-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredEmployees.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">No employees found</p>
                  <p className="text-slate-400">
                    {searchTerm ? "Try adjusting your search" : "Add your first employee to get started"}
                  </p>
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    isAdmin={isAdmin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
