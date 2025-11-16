'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { UserProfileTransformed } from '@/hooks/usePersonalizationProfiles';
import type { Period } from '@/utils/default-data';

interface ProfilesTrendChartProps {
  profiles: UserProfileTransformed[];
  period: Period;
}

export function ProfilesTrendChart({ profiles, period }: ProfilesTrendChartProps) {
  const chartData = useMemo(() => {
    if (profiles.length === 0) {
      return [];
    }

    // Group profiles by time period (day)
    const grouped = new Map<string, { created: number; updated: number }>();

    profiles.forEach((profile) => {
      const createdDate = new Date(profile.createdAt).toISOString().split('T')[0];
      const updatedDate = new Date(profile.updatedAt).toISOString().split('T')[0];
      
      // Count created
      if (!grouped.has(createdDate)) {
        grouped.set(createdDate, { created: 0, updated: 0 });
      }
      const createdGroup = grouped.get(createdDate)!;
      createdGroup.created++;

      // Count updated (if different from created)
      if (updatedDate !== createdDate) {
        if (!grouped.has(updatedDate)) {
          grouped.set(updatedDate, { created: 0, updated: 0 });
        }
        const updatedGroup = grouped.get(updatedDate)!;
        updatedGroup.updated++;
      }
    });

    // Convert to array and sort
    const data = Array.from(grouped.entries())
      .map(([date, counts]) => ({
        date,
        created: counts.created,
        updated: counts.updated,
        total: counts.created + counts.updated,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Fill in missing dates for better visualization
    if (data.length > 0) {
      const startDate = new Date(data[0].date);
      const endDate = new Date(data[data.length - 1].date);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const filledData: typeof data = [];
      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const existing = data.find((d) => d.date === dateStr);
        filledData.push(existing || { date: dateStr, created: 0, updated: 0, total: 0 });
      }
      return filledData;
    }

    return data;
  }, [profiles]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground/60">
        <p>No data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border border-default rounded-lg shadow-lg">
          <p className="font-semibold text-foreground mb-2">
            {new Date(payload[0].payload.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return period === 'today' 
              ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis 
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          label={{ value: 'Profiles', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="created"
          name="Created"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="updated"
          name="Updated"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="total"
          name="Total"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

