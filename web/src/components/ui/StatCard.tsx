import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
  icon?: React.ReactNode;
  trend?: { value: string; direction: 'up' | 'down' };
  children?: React.ReactNode;
}

export default function StatCard({
  label,
  value,
  subtitle,
  accentColor = 'var(--primary)',
  icon,
  trend,
  children,
}: StatCardProps) {
  return (
    <div className={styles.card} style={{ '--accent': accentColor } as React.CSSProperties}>
      <div className={styles.strip} />
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <div className={styles.valueRow}>
          <span className={styles.value}>{value}</span>
          {trend && (
            <span
              className={styles.trend}
              style={{
                color:
                  trend.direction === 'up'
                    ? 'var(--risk-critical)'
                    : 'var(--risk-low)',
              }}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        {children && <div className={styles.extra}>{children}</div>}
      </div>
      {icon && <div className={styles.icon}>{icon}</div>}
    </div>
  );
}
