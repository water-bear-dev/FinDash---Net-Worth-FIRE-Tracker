import React, { useState, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

interface AllocationData {
  name: string;
  value: number;
}

interface AllocationDonutChartProps {
  data: AllocationData[];
  height?: number;
  formatCurrency?: (value: number) => string;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6'];

// Custom shape for the active (hovered) sector
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6} // Makes the slice pop out
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={fill}
        strokeWidth={2}
      />
    </g>
  );
};

const AllocationDonutChart: React.FC<AllocationDonutChartProps> = ({ data, height = 300 }) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  // Memoize data processing to bundle small slices into "Others"
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const total = data.reduce((sum, entry) => sum + entry.value, 0);
    if (total === 0) return [];

    const largeItems: AllocationData[] = [];
    let othersValue = 0;

    data.forEach(item => {
      // Bundle anything less than 20% into "Others"
      if (item.value / total < 0.20) {
        othersValue += item.value;
      } else {
        largeItems.push(item);
      }
    });

    const finalData = [...largeItems];
    if (othersValue > 0.01) { // Add Others category only if it has a meaningful value
      finalData.push({ name: 'Others', value: othersValue });
    }
    
    // Sort by value descending for consistent color mapping
    return finalData.sort((a, b) => b.value - a.value);

  }, [data]);

  const totalValue = useMemo(() => processedData.reduce((sum, entry) => sum + entry.value, 0), [processedData]);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);
  
  const onMouseLeave = useCallback(() => {
    setActiveIndex(-1);
  }, []);

  if (processedData.length === 0) {
    return (
        <div style={{ width: '100%', height }} className="flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No data to display.</p>
        </div>
    );
  }

  const innerRadius = height * 0.25;
  const outerRadius = height * 0.35;
  const isVerticalLayout = height < 250;

  return (
    <div className={`flex ${isVerticalLayout ? 'flex-col' : 'flex-col md:flex-row'} items-center`} style={{ width: '100%', minHeight: height }}>
      <div className={`h-full ${isVerticalLayout ? 'w-full' : 'w-full md:w-1/2'}`} style={{ height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={processedData}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
              onMouseEnter={onPieEnter}
              onMouseLeave={onMouseLeave}
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none outline-none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={`p-4 ${isVerticalLayout ? 'w-full' : 'w-full md:w-1/2'}`}>
        <ul className="space-y-2">
          {processedData.map((entry, index) => {
            const percentage = totalValue > 0 ? (entry.value / totalValue * 100).toFixed(1) : '0.0';
            const isActive = index === activeIndex;
            return (
              <li 
                key={`legend-${index}`} 
                className={`flex items-center text-sm transition-all duration-200 ease-in-out cursor-default ${isActive ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(-1)}
              >
                <span className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="truncate">{entry.name}</span>
                <span className="ml-auto font-mono">{percentage}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AllocationDonutChart;
