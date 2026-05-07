'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import styles from './charts.module.css';

interface ZoneRiskChartProps {
  data: { name: string; value: number; color: string }[];
}

export default function ZoneRiskChart({ data }: ZoneRiskChartProps) {
  // Filter out 0 value items if necessary, but PieChart handles it
  
  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>ZONE RISK DISTRIBUTION</h2>
      </div>
      <div className={styles.chartBody} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-surface-highest)', borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Custom Legend to match image */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginTop: '16px' }}>
          {data.map((entry) => (
            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }} />
              <span style={{ color: 'var(--text-muted)' }}>{entry.name} &times;{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
