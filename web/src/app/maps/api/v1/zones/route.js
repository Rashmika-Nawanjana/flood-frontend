import { NextResponse } from 'next/server';

// Simple stub for GET /api/v1/zones
export async function GET() {
  const payload = {
    status: 'success',
    timestamp: new Date().toISOString(),
    count: 2,
    data: [
      {
        zone_id: 'ZONE-K1',
        zone_name: 'Getambe Basin',
        description: 'Lower Mahaweli region near Peradeniya',
        risk_level: 'HIGH',
        risk_score: 78.4,
        color_code: '#F97316',
        population_at_risk: 20500,
        sensors_in_zone: ['MR-KND-001'],
        active_alerts: 1,
        last_updated: new Date().toISOString(),
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [80.6100, 7.2700],
              [80.6200, 7.2700],
              [80.6200, 7.2800],
              [80.6100, 7.2800],
              [80.6100, 7.2700]
            ]
          ]
        },
        current_conditions: {
          avg_water_level_m: 3.2,
          max_water_level_m: 3.8,
          avg_flow_velocity_mps: 0.95,
          total_rainfall_mm: 145.2,
          trend: 'RISING'
        }
      },
      {
        zone_id: 'ZONE-K2',
        zone_name: 'Peradeniya Basin',
        description: 'Upstream basin near Peradeniya Bridge',
        risk_level: 'MEDIUM',
        risk_score: 45.2,
        color_code: '#F9A825',
        population_at_risk: 12000,
        sensors_in_zone: ['MR-KND-002'],
        active_alerts: 0,
        last_updated: new Date().toISOString(),
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [80.6000, 7.2500],
              [80.6150, 7.2500],
              [80.6150, 7.2650],
              [80.6000, 7.2650],
              [80.6000, 7.2500]
            ]
          ]
        },
        current_conditions: {
          avg_water_level_m: 2.1,
          max_water_level_m: 2.4,
          avg_flow_velocity_mps: 0.55,
          total_rainfall_mm: 12.3,
          trend: 'STABLE'
        }
      }
    ]
  };

  return NextResponse.json(payload);
}
