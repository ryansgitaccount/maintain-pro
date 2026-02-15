import React, { useState, useEffect, useCallback } from 'react';
import { WorkshopInventory } from '@/api/entities';
import { Machine } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Package } from 'lucide-react';
import InventoryForm from '../components/inventory/InventoryForm';
import PartsInventoryTable from '../components/inventory/PartsInventoryTable';
import PartsCSVImportDialog from '../components/inventory/PartsCSVImportDialog';
import { useToast } from "@/components/ui/useToast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function WorkshopInventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [machines, setMachines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
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
        try {
            if (editingItem) {
                await WorkshopInventory.update(editingItem.id, formData);
                toast({ title: "Success", description: "Part updated successfully." });
            } else {
                await WorkshopInventory.create(formData);
                toast({ title: "Success", description: "New part added to inventory." });
            }
            setShowForm(false);
            setEditingItem(null);
            loadData();
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to save part.",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowForm(true);
    };
    
    const handleDeleteClick = (itemId) => {
        setDeleteId(itemId);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        
        try {
            await WorkshopInventory.delete(deleteId);
            toast({ title: "Success", description: "Part deleted successfully." });
            loadData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete part.",
                variant: "destructive",
            });
        } finally {
            setDeleteId(null);
        }
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingItem(null);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                            <Package className="w-8 h-8" />
                            Parts Inventory
                        </h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-1">
                            Manage parts inventory with service intervals and machine assignments
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <PartsCSVImportDialog onImportComplete={loadData} />
                        <Button onClick={handleAddNew} className="flex-1 sm:flex-none">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Part
                        </Button>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="text-center py-20">
                        <Loader2 className="w-10 h-10 text-slate-400 mx-auto animate-spin mb-4" />
                        <p className="text-slate-500 text-lg">Loading inventory...</p>
                    </div>
                ) : (
                    <PartsInventoryTable 
                        data={inventory}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                    />
                )}

                {/* Edit/Add Form Dialog */}
                <InventoryForm
                    item={editingItem}
                    machines={machines}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancel}
                    open={showForm}
                />

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Part</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this part from inventory? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDeleteConfirm}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}