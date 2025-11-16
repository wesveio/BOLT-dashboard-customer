'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DeviceDistributionChartProps {
  data: Record<string, number>;
}

const COLORS = {
  mobile: '#3b82f6', // blue-500
  desktop: '#8b5cf6', // purple-500
  tablet: '#ec4899', // pink-500
  unknown: '#6b7280', // gray-500
};

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Mobile',
  desktop: 'Desktop',
  tablet: 'Tablet',
  unknown: 'Unknown',
};

export function DeviceDistributionChart({ data }: DeviceDistributionChartProps) {
  const chartData = Object.entries(data)
    .map(([device, value]) => ({
      name: DEVICE_LABELS[device] || device,
      value,
      device,
      color: COLORS[device as keyof typeof COLORS] || COLORS.unknown,
    }))
    .filter((item) => item.value > 0); // Only show non-zero values

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-background p-3 border border-default rounded-lg shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-foreground/70">
            {data.value} profiles ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (total === 0 || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground/60">
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

