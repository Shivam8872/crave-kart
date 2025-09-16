
import React from 'react';
import { 
  BarChart as RechartsBarChart, 
  LineChart as RechartsLineChart, 
  PieChart as RechartsPieChart,
  Bar,
  Line,
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';

type DataPoint = Record<string, any>;

interface ChartProps {
  data: DataPoint[];
  index: string;
  categories?: string[];
  valueKey?: string;
  colors?: string[];
  height?: number;
  width?: number;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  startEndOnly?: boolean;
  showAnimation?: boolean;
  valueFormatter?: (value: number) => string;
}

// Bar Chart Component
export function BarChart({
  data,
  index,
  categories = ['value'],
  colors = ['#8B5CF6', '#EC4899', '#14B8A6'],
  height = 300,
  width,
  showXAxis = false,
  showYAxis = false,
  showGrid = false,
  showTooltip = true,
  showLegend = true,
  showAnimation = false,
  valueFormatter = (value: number) => `${value}`
}: ChartProps) {
  return (
    <ResponsiveContainer width={width || '100%'} height={height}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        {showXAxis && <XAxis 
          dataKey={index} 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
        />}
        {showYAxis && <YAxis 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
        />}
        {showTooltip && <Tooltip 
          formatter={valueFormatter}
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        />}
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[i % colors.length]}
            animationDuration={showAnimation ? 1500 : 0}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

// Line Chart Component
export function LineChart({
  data,
  index,
  categories = ['value'],
  colors = ['#8B5CF6', '#EC4899', '#14B8A6'],
  height = 300,
  width,
  showXAxis = false,
  showYAxis = false,
  showGrid = false,
  showTooltip = true,
  showLegend = true,
  startEndOnly = false,
  showGradient = false,
  valueFormatter = (value: number) => `${value}`
}: ChartProps & { showGradient?: boolean }) {
  return (
    <ResponsiveContainer width={width || '100%'} height={height}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        
        <XAxis 
          dataKey={index} 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
          tickFormatter={(value) => {
            if (startEndOnly) {
              const isFirst = data.findIndex((d) => d[index] === value) === 0;
              const isLast = data.findIndex((d) => d[index] === value) === data.length - 1;
              return isFirst || isLast ? value : '';
            }
            return value;
          }}
          style={showXAxis ? {} : { display: 'none' }}
        />
        
        <YAxis 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
          style={showYAxis ? {} : { display: 'none' }}
        />
        
        {showTooltip && <Tooltip 
          formatter={valueFormatter}
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        />}
        
        {showLegend && <Legend />}
        
        {categories.map((category, i) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={{ fill: colors[i % colors.length], r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={1500}
          >
            {showGradient && (
              <defs>
                <linearGradient id={`color-${category}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0}/>
                </linearGradient>
              </defs>
            )}
          </Line>
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

// Pie Chart Component
export function PieChart({
  data,
  index,
  valueKey = 'value',
  colors = ['#8B5CF6', '#EC4899', '#14B8A6', '#3B82F6', '#F97316', '#EAB308', '#84CC16'],
  height = 300,
  width,
  showTooltip = true,
  showLegend = true,
  valueFormatter = (value: number) => `${value}`
}: ChartProps) {
  return (
    <ResponsiveContainer width={width || '100%'} height={height}>
      <RechartsPieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        {showTooltip && <Tooltip 
          formatter={valueFormatter}
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        />}
        
        {showLegend && <Legend />}
        
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={index}
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={40}
          paddingAngle={2}
          animationDuration={1500}
          label
        >
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
          ))}
        </Pie>
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
