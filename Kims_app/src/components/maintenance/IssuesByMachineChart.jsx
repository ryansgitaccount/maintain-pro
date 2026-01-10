import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function IssuesByMachineChart({ issues, machines }) {
    const chartData = useMemo(() => {
        const issuesByMachine = issues.reduce((acc, issue) => {
            const machine = machines.find(m => m.id === issue.machine_id);
            const machineName = machine ? `${machine.plant_id} - ${machine.model}` : 'Unknown';
            
            if (!acc[machineName]) {
                acc[machineName] = { open: 0, in_progress: 0, resolved: 0 };
            }

            if (issue.status === 'open') acc[machineName].open += 1;
            if (issue.status === 'in_progress') acc[machineName].in_progress += 1;
            if (issue.status === 'resolved') acc[machineName].resolved += 1;
            
            return acc;
        }, {});

        return Object.entries(issuesByMachine).map(([name, counts]) => ({ name, ...counts }));
    }, [issues, machines]);

    if (!chartData || chartData.length === 0) {
        return <div className="text-center text-slate-500 py-10">No issue data to display.</div>;
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="open" stackId="a" fill="#ef4444" name="Open" />
                    <Bar dataKey="in_progress" stackId="a" fill="#f97316" name="In Progress" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}