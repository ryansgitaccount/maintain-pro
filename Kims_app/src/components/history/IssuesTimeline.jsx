import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import _ from 'lodash';

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-lg max-w-sm">
                <p className="font-bold text-slate-800 text-lg">{label}</p>
                <p className="text-sm text-slate-600 mb-2">{`Resolved Issues: ${data.count}`}</p>
                 <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 max-h-48 overflow-y-auto">
                  {data.issueTitles.map((title, index) => (
                    <li key={index} className="truncate">{title}</li>
                  ))}
                </ul>
            </div>
        );
    }
    return null;
};


export default function IssuesTimeline({ issues, machines }) {
    if (!issues || issues.length === 0) {
        return (
            <Card className="mt-6">
                <CardContent className="text-center py-12">
                    <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">No resolved issues to display in a graph</p>
                    <p className="text-slate-400">Try adjusting your filters.</p>
                </CardContent>
            </Card>
        );
    }

    // Process data for the line chart
    const data = _.chain(issues)
        .groupBy(issue => format(parseISO(issue.resolved_date), 'yyyy-MM-dd'))
        .map((groupedIssues, date) => ({
            date: format(parseISO(date), 'MMM d'),
            fullDate: date,
            count: groupedIssues.length,
            issueTitles: groupedIssues.map(i => i.title),
        }))
        .sortBy('fullDate')
        .value();

    return (
        <Card className="mt-6 bg-white shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Resolved Issues Over Time
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 0,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" />
                        <YAxis allowDecimals={false} stroke="#64748b" label={{ value: 'Issues Resolved', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle' } }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="count" name="Resolved Issues" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}