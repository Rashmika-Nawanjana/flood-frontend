'use client';

import styles from './charts.module.css';

interface RiskFactor {
  factor: string;
  value: string;
  impact: 'High' | 'Medium' | 'Low';
}

interface XaiRiskFactorsProps {
  factors: RiskFactor[];
  modelVersion: string;
}

export default function XaiRiskFactors({ factors, modelVersion }: XaiRiskFactorsProps) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'var(--risk-critical)';
      case 'Medium': return 'var(--risk-warning)';
      case 'Low': return 'var(--risk-low)';
      default: return 'var(--text-muted)';
    }
  };

  const getImpactWidth = (impact: string) => {
    switch (impact) {
      case 'High': return '85%';
      case 'Medium': return '50%';
      case 'Low': return '20%';
      default: return '10%';
    }
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>XAI TOP RISK FACTORS</h2>
      </div>
      <div className={styles.chartBody} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className={styles.xaiList}>
          {factors.map((f, i) => (
            <div key={i} className={styles.xaiItem}>
              <span className={styles.xaiLabel}>{f.factor}</span>
              <div className={styles.xaiBarContainer}>
                <div className={styles.xaiBarBg}>
                  <div 
                    className={styles.xaiBarFill} 
                    style={{ 
                      width: getImpactWidth(f.impact), 
                      backgroundColor: getImpactColor(f.impact) 
                    }} 
                  />
                </div>
                <span className={styles.xaiValue}>{f.value}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles.xaiFooter}>
          <span className={styles.modelName}>Model: {modelVersion}</span>
        </div>
      </div>
    </div>
  );
}
