import { NextResponse } from 'next/server';

// Stub for GET /api/v1/sensors
export async function GET() {
  const payload = {
    status: 'success',
    timestamp: new Date().toISOString(),
    count: 2,
    data: [
      {
        sensor_id: 'MR-KND-001',
        name: 'Mahaweli River — Getambe Bridge',
        location: {
          lat: 7.2721,
          lng: 80.6132,
          zone_id: 'ZONE-K1',
          zone_name: 'Getambe Basin'
        },
        readings: {
          water_level_m: 4.53,
          rainfall_mm_per_hr: 8.2,
          flow_velocity_mps: 0.85,
          temperature_c: 28.5,
          air_pressure_hpa: 1011.2
        },
        status: {
          device_online: true,
          battery_percent: 75,
          signal_strength_dbm: -68,
          last_seen: new Date().toISOString()
        },
        thresholds: {
          water_level_warning_m: 5.0,
          water_level_critical_m: 6.5
        }
      },
      {
        sensor_id: 'MR-KND-002',
        name: 'Mahaweli River — Peradeniya',
        location: {
          lat: 7.2520,
          lng: 80.5921,
          zone_id: 'ZONE-K2',
          zone_name: 'Peradeniya Basin'
        },
        readings: {
          water_level_m: 2.1,
          rainfall_mm_per_hr: 0.0,
          flow_velocity_mps: 0.42,
          temperature_c: 27.8,
          air_pressure_hpa: 1012.5
        },
        device_health: {
          is_online: true,
          battery_percent: 92,
          signal_strength_dbm: -55,
          last_seen: new Date().toISOString()
        },
        thresholds: {
          warning_m: 3.5,
          critical_m: 5.0
        }
      }
    ]
  };

  return NextResponse.json(payload);
}
