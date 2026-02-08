import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkshopInventory } from '@/api/entities';
import { Machine } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Boxes, Search } from 'lucide-react';
import InventoryForm from '../components/inventory/InventoryForm';
import InventoryItemCard from '../components/inventory/InventoryItemCard';
import { useToast } from "@/components/ui/useToast";

export default function WorkshopInventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [machines, setMachines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showLowStock, setShowLowStock] = useState(false);
    const [machineTypeFilter, setMachineTypeFilter] = useState("all");
    const [machineFilter, setMachineFilter] = useState("all");
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [items, machinesData] = await Promise.all([
                WorkshopInventory.list('-updated_at'),
                Machine.list()
            ]);
            setInventory(items);
            setMachines(machinesData);
        } catch (error) {
            toast({
                title: "Error Loading Data",
                description: "Could not fetch inventory or machine data.",
                variant: "destructive",
            });
        }
        setIsLoading(false);
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFormSubmit = async (formData) => {
        if (editingItem) {
            await WorkshopInventory.update(editingItem.id, formData);
            toast({ title: "Success", description: "Inventory item updated." });
        } else {
            await WorkshopInventory.create(formData);
            toast({ title: "Success", description: "New item added to inventory." });
        }
        setShowForm(false);
        setEditingItem(null);
        loadData();
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowForm(true);
    };
    
    const handleDelete = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this inventory item?")) {
            await WorkshopInventory.delete(itemId);
            toast({ title: "Item Deleted", description: "The inventory item has been removed." });
            loadData();
        }
    };
    
    const machineTypes = useMemo(() => {
        const types = new Set(machines.map(m => m.machine_type).filter(Boolean));
        return ['all', ...Array.from(types).sort()];
    }, [machines]);
    
    const filteredMachinesForSelect = useMemo(() => {
        if (machineTypeFilter === 'all') {
            return machines.sort((a,b) => (a.plant_id || '').localeCompare(b.plant_id || ''));
        }
        return machines.filter(m => m.machine_type === machineTypeFilter).sort((a,b) => (a.plant_id || '').localeCompare(b.plant_id || ''));
    }, [machines, machineTypeFilter]);

    const filteredInventory = useMemo(() => {
        return inventory
            .filter(item => {
                if (!searchTerm) return true;
                const lowerSearch = searchTerm.toLowerCase();
                return (
                    item.part_name.toLowerCase().includes(lowerSearch) ||
                    item.part_number.toLowerCase().includes(lowerSearch) ||
                    (item.supplier && item.supplier.toLowerCase().includes(lowerSearch)) ||
                    (item.location && item.location.toLowerCase().includes(lowerSearch))
                );
            })
            .filter(item => {
                if (!showLowStock) return true;
                return item.quantity_on_hand <= (item.reorder_level || 0);
            })
            .filter(item => {
                if (machineFilter !== 'all') {
                    return item.machine_id === machineFilter;
                }
                if (machineTypeFilter !== 'all') {
                    return item.machine_type === machineTypeFilter;
                }
                return true;
            });
    }, [inventory, searchTerm, showLowStock, machineTypeFilter, machineFilter]);

    const getMachineById = (id) => machines.find(m => m.id === id);

    return (
        <div className="p-4 sm:p-6 space-y-8 bg-slate-50 w-full">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Workshop Inventory</h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-1">Manage parts and supplies for the workshop.</p>
                    </div>
                    <Button onClick={() => { setEditingItem(null); setShowForm(true); }} className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Item
                    </Button>
                </div>

                {showForm && (
                    <InventoryForm
                        item={editingItem}
                        machines={machines}
                        onSubmit={handleFormSubmit}
                        onCancel={() => { setShowForm(false); setEditingItem(null); }}
                    />
                )}

                {!showForm && (
                    <>
                        <Card className="bg-white shadow-sm border-slate-200 mb-6">
                            <CardContent className="p-4 flex flex-col gap-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                        <Input 
                                            placeholder="Search by name, part number, supplier..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="low-stock-filter" 
                                            checked={showLowStock}
                                            onCheckedChange={setShowLowStock}
                                        />
                                        <Label htmlFor="low-stock-filter">Show Low Stock Only</Label>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <Select value={machineTypeFilter} onValueChange={value => { setMachineTypeFilter(value); setMachineFilter("all"); }}>
                                        <SelectTrigger className="w-full md:w-64">
                                            <SelectValue placeholder="Filter by machine type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Machine Types</SelectItem>
                                            <SelectItem value="general">General Stock</SelectItem>
                                            {machineTypes.map(type => (
                                                type !== 'all' && (
                                                <SelectItem key={type} value={type}>
                                                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </SelectItem>
                                                )
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={machineFilter} onValueChange={setMachineFilter}>
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Filter by specific machine..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="all">All Machines</SelectItem>
                                          {filteredMachinesForSelect.map(machine => (
                                            <SelectItem key={machine.id} value={machine.id}>
                                              {machine.plant_id} - {machine.model}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {isLoading ? (
                            <div className="text-center py-12">
                                <Loader2 className="w-8 h-8 text-slate-400 mx-auto animate-spin mb-4" />
                                <p className="text-slate-500">Loading inventory...</p>
                            </div>
                        ) : filteredInventory.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredInventory.map(item => (
                                    <InventoryItemCard
                                        key={item.id}
                                        item={item}
                                        machine={getMachineById(item.machine_id)}
                                        onEdit={() => handleEdit(item)}
                                        onDelete={() => handleDelete(item.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Card className="bg-white shadow-sm border-slate-200">
                                <CardContent className="p-12 text-center">
                                    <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-slate-700">No Inventory Found</h3>
                                    <p className="text-slate-500 mt-2">There are no items matching your search or filter.</p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}