'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import styles from './charts.module.css';

interface FloodProbabilityChartProps {
  data: { zone: string; probability: number }[];
}

export default function FloodProbabilityChart({ data }: FloodProbabilityChartProps) {
  const getColor = (prob: number) => {
    if (prob >= 80) return 'var(--risk-critical)';
    if (prob >= 60) return 'var(--risk-high)';
    if (prob >= 40) return 'var(--risk-warning)';
    return 'var(--risk-low)';
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>AI PREDICTION — FLOOD PROBABILITY</h2>
      </div>
      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 45, bottom: 5 }}>
            <CartesianGrid stroke="var(--text-muted)" horizontal={false} vertical={true} strokeOpacity={0.4} />
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              ticks={[0, 50, 100]}
              stroke="var(--text-muted)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => `${val}%`}
            />
            <YAxis 
              dataKey="zone" 
              type="category" 
              stroke="var(--text-primary)" 
              fontSize={13} 
              tickLine={false} 
              axisLine={false}
            />
            <Tooltip 
              cursor={false}
              contentStyle={{ 
                backgroundColor: 'var(--bg-surface-highest)', 
                borderColor: 'var(--border)', 
                borderRadius: 'var(--radius)',
                fontSize: '12px',
                padding: '4px 8px'
              }}
              itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }}
              labelStyle={{ fontSize: '12px', marginBottom: '2px' }}
              formatter={(value) => [`${value}%`, 'Probability']}
            />
            <Bar dataKey="probability" barSize={24} radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.probability)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
