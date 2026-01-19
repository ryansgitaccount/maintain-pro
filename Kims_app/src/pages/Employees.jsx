
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Shield, Search, HardHat, Wrench, WifiOff, ShieldAlert } from "lucide-react";
import EmployeeCard from "../components/employees/EmployeeCard";

export default function Employees() {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // Add state for error messages
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null); // Clear previous errors
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // For now, just show the current user
            // In the future, you could add user metadata to check for admin role
            if (user) {
                setEmployees([user]); // Display only the current user
            }
        } catch (err) {
            console.error("Failed to load employees:", err);
            // Handle specific error types
            if (err.message && err.message.includes("Network")) {
                setError("A network error occurred. Please check your connection and try again.");
            } else {
                setError("An unexpected error occurred while loading employee data.");
            }
            setEmployees([]); // Clear employees on error
            setCurrentUser(null); // Clear current user on error for safety
        }
        setIsLoading(false);
    };

    useEffect(() => {
        let filtered = employees;
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = employees.filter(emp =>
                emp.full_name.toLowerCase().includes(lowercasedTerm) ||
                emp.email.toLowerCase().includes(lowercasedTerm)
            );
        }
        setFilteredEmployees(filtered);
    }, [employees, searchTerm]);

    const stats = useMemo(() => ({
        total: employees.length,
        admins: employees.filter(e => e.role === 'admin' || (e.employee_types && e.employee_types.includes('admin'))).length,
        operators: employees.filter(e => e.employee_types && e.employee_types.includes('operator')).length,
        workshop_staff: employees.filter(e => e.employee_types && e.employee_types.includes('workshop_staff')).length,
    }), [employees]);


    return (
        <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Employee List</h1>
                        <p className="text-slate-600 mt-1">View all registered users in the system</p>
                    </div>
                </div>

                {/* Stats Cards - only show for admins */}
                {currentUser?.role === 'admin' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                                        <p className="text-sm text-blue-600">Admins</p>
                                        <p className="text-2xl font-bold text-blue-600">{stats.admins}</p>
                                    </div>
                                    <Shield className="w-8 h-8 text-blue-400" />
                                </div>
                            </CardContent>
                        </Card>
                         <Card className="bg-white shadow-sm border-slate-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-teal-600">Operators</p>
                                        <p className="text-2xl font-bold text-teal-600">{stats.operators}</p>
                                    </div>
                                    <HardHat className="w-8 h-8 text-teal-400" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white shadow-sm border-slate-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-indigo-600">Workshop Staff</p>
                                        <p className="text-2xl font-bold text-indigo-600">{stats.workshop_staff}</p>
                                     </div>
                                    <Wrench className="w-8 h-8 text-indigo-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Search - only show for admins */}
                {currentUser?.role === 'admin' && (
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
                )}
                
                {/* Error Display */}
                {error && (
                    <Card className="bg-yellow-50 border-yellow-200 mb-6">
                        <CardContent className="p-4 flex items-center gap-3">
                             {error.includes("permission") ? (
                                <ShieldAlert className="w-5 h-5 text-yellow-600" />
                            ) : (
                                <WifiOff className="w-5 h-5 text-yellow-600" />
                            )}
                            <p className="text-yellow-800 font-medium">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Employee Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array(6).fill(0).map((_, i) => (
                            <Card key={i} className="bg-white shadow-sm border-slate-200 animate-pulse">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded"></div>
                                        <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : filteredEmployees.length === 0 && !error ? (
                        <div className="col-span-full text-center py-12">
                            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-lg">No employees found</p>
                            <p className="text-slate-400">No users match your search criteria.</p>
                        </div>
                    ) : (
                        filteredEmployees.map((employee) => (
                            <EmployeeCard key={employee.id} employee={employee} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
