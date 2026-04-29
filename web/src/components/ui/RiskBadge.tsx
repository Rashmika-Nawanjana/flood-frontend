import { RISK_COLORS } from '@/lib/constants';
import styles from './RiskBadge.module.css';

interface RiskBadgeProps {
  level: string;
  size?: 'sm' | 'md';
}

export default function RiskBadge({ level, size = 'sm' }: RiskBadgeProps) {
  const riskInfo = RISK_COLORS[level.toUpperCase()] || RISK_COLORS.LOW;

  return (
    <span
      className={`${styles.badge} ${styles[size]}`}
      style={{
        '--badge-color': riskInfo.color,
        '--badge-bg': riskInfo.bg,
      } as React.CSSProperties}
    >
      {riskInfo.label}
    </span>
  );
}
