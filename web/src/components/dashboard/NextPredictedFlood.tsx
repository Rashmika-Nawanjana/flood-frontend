'use client';

import { useState, useEffect } from 'react';
import styles from './charts.module.css';

interface NextPredictedFloodProps {
  zoneName: string;
  severity: string;
  estimatedTime: string;
  peakLevel: number;
}

export default function NextPredictedFlood({ zoneName, severity, estimatedTime, peakLevel }: NextPredictedFloodProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const targetDate = new Date(estimatedTime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft('IMMINENT');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [estimatedTime]);

  const isImminent = timeLeft === 'IMMINENT';

  return (
    <div className={styles.chartContainer} style={{ justifyContent: 'center' }}>
      <div className={styles.chartHeader} style={{ marginBottom: 0 }}>
        <h2 className={styles.chartTitle}>NEXT PREDICTED FLOOD</h2>
      </div>
      
      <div className={styles.countdownCard}>
        <div className={styles.predictionZone}>
          {zoneName} · {severity} severity
        </div>
        
        <div className={styles.imminentText} style={{ color: isImminent ? 'var(--risk-critical)' : 'var(--risk-high)' }}>
          {timeLeft}
        </div>
        
        <div className={styles.estimatedLabel}>
          estimated until peak
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Peak Level</span>
            <span className={`${styles.statValue} ${peakLevel >= 5.0 ? styles.red : ''}`}>{peakLevel}m</span>
          </div>
        </div>

        <div className={styles.thresholds}>
          <span>Warning threshold: 5.0m</span>
          <span>Critical: 6.5m</span>
        </div>
      </div>
    </div>
  );
}
