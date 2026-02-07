import React, { useState, useEffect } from "react";
import { Take5Record } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus } from "lucide-react";
import Take5Executor from "../components/take5/Take5Executor";
import Take5History from "../components/take5/Take5History";

export default function Take5Page() {
    const [showForm, setShowForm] = useState(false);
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadRecords = async () => {
        setIsLoading(true);
        try {
            const data = await Take5Record.list('-completed_at', 20);
            setRecords(data);
        } catch (error) {
            console.error("Failed to load Take 5 records:", error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadRecords();
    }, []);

    const handleComplete = () => {
        setShowForm(false);
        loadRecords();
    };

    return (
        <div className="p-4 sm:p-6 space-y-8 bg-slate-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Take 5 Safety</h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-1">Stop, think, and assess before you start.</p>
                    </div>
                    {!showForm && (
                         <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Start New Take 5
                        </Button>
                    )}
                </div>

                {showForm ? (
                    <Take5Executor onComplete={handleComplete} onCancel={() => setShowForm(false)} />
                ) : (
                    <Take5History records={records} />
                )}
            </div>
        </div>
    );
}