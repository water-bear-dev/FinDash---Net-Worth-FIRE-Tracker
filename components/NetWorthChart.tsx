
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NetWorthChartProps {
  data: { month: string; netWorth: number }[];
}

const NetWorthChart: React.FC<NetWorthChartProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
          <XAxis dataKey="month" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              borderColor: '#374151',
              color: '#E5E7EB',
            }}
            formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Net Worth']}
          />
          <Line type="monotone" dataKey="netWorth" stroke="#6366F1" strokeWidth={2} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NetWorthChart;
