import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { zone_id } = params;

  if (zone_id === 'ZONE-K1') {
    const payload = {
      status: 'success',
      data: {
        zone_id: 'ZONE-K1',
        zone_name: 'Getambe Basin',
        description: 'Lower Mahaweli region near Peradeniya',
        risk_level: 'HIGH',
        risk_score: 78.4,
        color_code: '#F97316',
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
        prediction: {
          flood_probability_percent: 82.3,
          predicted_peak_level_m: 4.8,
          estimated_flood_time: '2026-04-25T23:45:00Z',
          confidence_percent: 87.1,
          model_version: 'v3.2.1-xgboost'
        },
        current_conditions: {
          avg_water_level_m: 3.2,
          max_water_level_m: 3.8,
          avg_flow_velocity_mps: 0.95,
          total_rainfall_mm: 145.2,
          trend: 'RISING'
        },
        population_at_risk: 20500,
        shelters: [
          {
            shelter_id: 'SH-K001',
            name: 'Getambe Temple Hall',
            capacity: 400,
            current_occupancy: 150,
            lat: 7.2715,
            lng: 80.6125,
            distance_km: 0.8,
            contact_number: '+94812222222'
          }
        ]
      }
    };

    return NextResponse.json(payload);
  }

  return NextResponse.json({ status: 'error', message: 'Zone not found' }, { status: 404 });
}
