'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import styles from './charts.module.css';

interface WaterLevelChartProps {
  data: any[];
}

export default function WaterLevelChart({ data }: WaterLevelChartProps) {
  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>24H WATER LEVEL TREND — SENSORS</h2>
      </div>
      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="var(--text-muted)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="var(--text-muted)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => `${val}m`}
              domain={[1.5, 6]}
              ticks={[1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-surface-highest)', 
                borderColor: 'var(--border)', 
                borderRadius: 'var(--radius)',
                fontSize: '12px',
                padding: '4px 8px'
              }}
              itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }}
              labelStyle={{ fontSize: '12px', marginBottom: '2px' }}
            />
            <ReferenceLine 
              y={5.0} 
              stroke="var(--risk-warning)" 
              strokeDasharray="4 4" 
              label={{ 
                position: 'top', 
                value: 'Warning 5.0m', 
                fill: 'var(--risk-warning)', 
                fontSize: 12, 
                offset: 10,
                textAnchor: 'start'
              }} 
            />
            <Legend verticalAlign="bottom" height={36} iconType="plainline" />
            {Object.keys(data[0] || {}).filter(key => key !== 'time').map((key, idx) => (
              <Line 
                key={key}
                type="monotone" 
                dataKey={key} 
                name={key.charAt(0).toUpperCase() + key.slice(1)} 
                stroke={idx === 0 ? "var(--risk-critical)" : "#5c7cfa"} 
                strokeWidth={idx === 0 ? 3 : 2}
                strokeDasharray={idx === 0 ? undefined : "4 4"}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
