import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  height?: number;
}

export default function ProgressBar({
  value,
  max,
  color,
  showLabel = true,
  height = 6,
}: ProgressBarProps) {
  const percent = Math.min(Math.round((value / max) * 100), 100);

  const barColor =
    color ||
    (percent >= 90
      ? 'var(--risk-critical)'
      : percent >= 70
        ? 'var(--risk-warning)'
        : percent >= 50
          ? 'var(--risk-watch)'
          : 'var(--risk-low)');

  return (
    <div className={styles.container}>
      <div className={styles.track} style={{ height }}>
        <div
          className={styles.fill}
          style={{
            width: `${percent}%`,
            backgroundColor: barColor,
            height,
          }}
        />
      </div>
      {showLabel && (
        <span className={styles.label} style={{ color: barColor }}>
          {percent}%
        </span>
      )}
    </div>
  );
}
