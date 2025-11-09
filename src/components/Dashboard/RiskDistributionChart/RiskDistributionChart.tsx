'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RiskDistributionChartProps {
  data: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

const COLORS = {
  low: '#10b981', // green-500
  medium: '#eab308', // yellow-500
  high: '#f97316', // orange-500
  critical: '#ef4444', // red-500
};

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  const chartData = [
    { name: 'Low', value: data.low, color: COLORS.low },
    { name: 'Medium', value: data.medium, color: COLORS.medium },
    { name: 'High', value: data.high, color: COLORS.high },
    { name: 'Critical', value: data.critical, color: COLORS.critical },
  ].filter((item) => item.value > 0); // Only show non-zero values

  const total = data.low + data.medium + data.high + data.critical;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} sessions ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => {
            const item = chartData.find((d) => d.name === value);
            return item ? `${value} (${item.value})` : value;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

