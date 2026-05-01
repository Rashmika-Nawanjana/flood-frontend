import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { sensor_id } = params;

  if (sensor_id === 'MR-KND-001') {
    const payload = {
      status: 'success',
      data: {
        sensor_id: 'MR-KND-001',
        name: 'Mahaweli River — Getambe Bridge',
        installed_date: '2025-11-20',
        is_active: true,
        location: {
          lat: 7.2721,
          lng: 80.6132,
          zone_id: 'ZONE-K1',
          address: 'Under Getambe Bridge, Peradeniya Road, Kandy'
        },
        current_reading: {
          water_level_m: 4.53,
          rainfall_mm_per_hr: 8.2,
          flow_velocity_mps: 0.85,
          temperature_c: 28.5,
          air_pressure_hpa: 1011.2,
          recorded_at: new Date().toISOString()
        },
        device_health: {
          is_online: true,
          battery_percent: 75,
          signal_strength_dbm: -68,
          last_maintenance: '2026-03-10',
          firmware_version: 'v1.0.2-esp32'
        },
        thresholds: {
          watch_m: 3.5,
          advisory_m: 4.5,
          warning_m: 5.0,
          critical_m: 6.5
        }
      }
    };

    return NextResponse.json(payload);
  }

  return NextResponse.json({ status: 'error', message: 'Sensor not found' }, { status: 404 });
}
