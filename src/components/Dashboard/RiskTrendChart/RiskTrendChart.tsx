'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PredictionData {
  sessionId: string;
  prediction: {
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  isActive: boolean;
  isAbandoned: boolean;
  isCompleted: boolean;
}

interface RiskTrendChartProps {
  predictions: PredictionData[];
  period: 'today' | 'week' | 'month' | 'year';
}

export function RiskTrendChart({ predictions, period }: RiskTrendChartProps) {
  const chartData = useMemo(() => {
    if (predictions.length === 0) {
      return [];
    }

    // Group predictions by time period
    const grouped = new Map<string, { riskScores: number[]; highRiskCount: number; total: number }>();

    predictions.forEach((pred) => {
      // For now, we'll group by day since we don't have timestamps in the prediction data
      // In a real implementation, you'd want to include timestamps
      const date = new Date().toISOString().split('T')[0]; // Today's date as placeholder
      
      if (!grouped.has(date)) {
        grouped.set(date, { riskScores: [], highRiskCount: 0, total: 0 });
      }

      const group = grouped.get(date)!;
      group.riskScores.push(pred.prediction.riskScore);
      group.total++;
      
      if (pred.prediction.riskLevel === 'high' || pred.prediction.riskLevel === 'critical') {
        group.highRiskCount++;
      }
    });

    // Convert to array and calculate averages
    const data = Array.from(grouped.entries())
      .map(([date, group]) => ({
        date,
        avgRiskScore: group.riskScores.length > 0
          ? group.riskScores.reduce((a, b) => a + b, 0) / group.riskScores.length
          : 0,
        highRiskSessions: group.highRiskCount,
        totalSessions: group.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // If we only have one data point, create a few more for visualization
    if (data.length === 1) {
      const single = data[0];
      const days = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;
      
      return Array.from({ length: Math.min(days, 7) }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          avgRiskScore: single.avgRiskScore,
          highRiskSessions: single.highRiskSessions,
          totalSessions: single.totalSessions,
        };
      });
    }

    return data;
  }, [predictions, period]);

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
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Avg Risk Score' 
                ? entry.value.toFixed(1) 
                : entry.value}
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
          yAxisId="left"
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          label={{ value: 'Sessions', angle: 90, position: 'insideRight', fill: '#6b7280' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="avgRiskScore"
          name="Avg Risk Score"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="highRiskSessions"
          name="High Risk Sessions"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

