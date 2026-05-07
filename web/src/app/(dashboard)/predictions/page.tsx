'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import RiskBadge from '@/components/ui/RiskBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import type { Prediction, ApiResponse } from '@/lib/types';
import styles from './page.module.css';

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, isAuthenticated } = useAuthStore();

  const fetchPredictions = useCallback(() => {
    if (!isAuthenticated || !user || !user.zone_id) return;
    setLoading(true);
    api.predictions.list(undefined, user.zone_id).then((res) => {
      const d = res as ApiResponse<Prediction[]>;
      setPredictions(d.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [isAuthenticated, user]);

  useEffect(() => { fetchPredictions(); }, [fetchPredictions]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>AI Flood Predictions</h1>
          <p className={styles.subtitle}>XGBoost ML model predictions with Explainable AI (XAI) risk factors</p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchPredictions} disabled={loading}>
          <RefreshCw size={16} className={loading ? styles.spinning : ''} /> Refresh Predictions
        </button>
      </div>

      <div className={styles.grid}>
        {predictions.map((pred) => {
          const isHighRisk = pred.severity === 'HIGH' || pred.severity === 'CRITICAL';
          return (
            <div key={pred.prediction_id} className={`${styles.card} ${isHighRisk ? styles.highRisk : ''}`}>
              <div className={styles.cardHeader}>
                <span className={styles.predId}>{pred.prediction_id}</span>
                <RiskBadge level={pred.severity} size="md" />
              </div>
              <h3 className={styles.zoneName}>{pred.zone_name}</h3>
              <span className={styles.window}>
                {new Date(pred.prediction_window?.from).toLocaleTimeString()} — {new Date(pred.prediction_window?.to).toLocaleTimeString()}
              </span>

              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Flood Probability</span>
                  <span className={styles.metricValue} style={{ color: isHighRisk ? 'var(--risk-critical)' : 'var(--risk-warning)' }}>
                    {pred.flood_probability_percent}%
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Peak Level</span>
                  <span className={styles.metricValue}>{pred.predicted_peak_level_m}m</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Confidence</span>
                  <span className={styles.metricValue} style={{ color: 'var(--risk-low)' }}>
                    {pred.confidence_percent}%
                  </span>
                </div>
              </div>

              {pred.top_risk_factors && pred.top_risk_factors.length > 0 && (
                <div className={styles.factors}>
                  <span className={styles.factorsTitle}>Top Risk Factors (XAI)</span>
                  {pred.top_risk_factors.map((f, i) => (
                    <div key={i} className={styles.factor}>
                      <div className={styles.factorInfo}>
                        <span className={styles.factorName}>{f.factor} ({f.value})</span>
                        <span className={`${styles.factorImpact} ${styles[`impact${f.impact}`]}`}>{f.impact} Impact</span>
                      </div>
                      <div className={styles.factorBar}>
                        <div className={styles.factorFill} style={{
                          width: f.impact === 'High' ? '90%' : f.impact === 'Medium' ? '60%' : '30%',
                          backgroundColor: f.impact === 'High' ? 'var(--risk-critical)' : f.impact === 'Medium' ? 'var(--risk-warning)' : 'var(--risk-low)',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.model}>Model: {pred.model_version}</div>
            </div>
          );
        })}
        {predictions.length === 0 && !loading && (
          <p className={styles.empty}>No predictions available</p>
        )}
      </div>
    </div>
  );
}
