import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, TooltipProps } from 'recharts';

interface AllocationData {
  name: string;
  value: number;
}

interface AllocationDonutChartProps {
  data: AllocationData[];
  height?: number;
  formatCurrency?: (value: number) => string;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

const AllocationDonutChart: React.FC<AllocationDonutChartProps> = ({ data, height = 300, formatCurrency = (val) => `$${val.toLocaleString()}` }) => {
  const innerRadius = height * 0.2;
  const outerRadius = height * 0.27;

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0];
      const percent = dataPoint.percent;
      if (typeof dataPoint.value !== 'number' || typeof percent !== 'number') return null;
      
      return (
        <div className="bg-gray-800 p-2 border border-gray-700 rounded-md text-white text-sm shadow-lg">
          <p className="font-semibold">{`${dataPoint.name}`}</p>
          <p>{`${formatCurrency(dataPoint.value)} (${(percent * 100).toFixed(1)}%)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AllocationDonutChart;