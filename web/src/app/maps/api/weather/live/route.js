import { NextResponse } from 'next/server';
import zoneData from '../../../map/data/floodzones.json';

const LOW_RISK_TIMEOUT_MS = 24 * 60 * 60 * 1000;

function shouldShowZone(zone) {
  if (zone.risk_level !== 'low') return true;
  const lastUpdated = new Date(zone.last_updated).getTime();
  return Date.now() - lastUpdated < LOW_RISK_TIMEOUT_MS;
}

function parseRainfall(rainfallText) {
  if (!rainfallText) return 0;
  const parsed = parseFloat(String(rainfallText).replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeZones(inputZones) {
  if (Array.isArray(inputZones) && inputZones.length) {
    return inputZones.filter((zone) =>
      zone &&
      typeof zone.zone_id === 'string' &&
      Array.isArray(zone.center) &&
      zone.center.length >= 2
    );
  }

  return zoneData.filter((zone) => zone.active && shouldShowZone(zone));
}

async function fetchCurrentWeather(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation&timezone=auto`;
  const response = await fetch(url, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`open_meteo_error_${response.status}`);
  }

  const payload = await response.json();
  return payload?.current ?? null;
}

export async function GET() {
  return NextResponse.json({
    message: 'POST zones to this endpoint to retrieve live rainfall and temperature data.',
    usage: {
      method: 'POST',
      body: {
        zones: [
          {
            zone_id: 'flood-colombo-001',
            center: [79.8612, 6.9271],
            rainfall_mm: '18 mm'
          }
        ]
      }
    }
  });
}

export async function POST(request) {
  let body = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const zones = normalizeZones(body?.zones);

  if (!zones.length) {
    return NextResponse.json(
      { error: 'No valid zones provided.' },
      { status: 400 }
    );
  }

  const requests = zones.map(async (zone) => {
    const [lng, lat] = zone.center;

    try {
      const current = await fetchCurrentWeather(lat, lng);
      if (!current) {
        return {
          zoneId: zone.zone_id,
          temperature: null,
          precipitation: null,
          updatedAt: new Date().toISOString()
        };
      }

      return {
        zoneId: zone.zone_id,
        temperature: Number(current.temperature_2m),
        precipitation: Number(current.precipitation),
        updatedAt: current.time || new Date().toISOString()
      };
    } catch {
      return {
        zoneId: zone.zone_id,
        temperature: null,
        precipitation: null,
        updatedAt: new Date().toISOString()
      };
    }
  });

  const results = await Promise.all(requests);
  const byZone = {};

  for (const item of results) {
    const matchingZone = zones.find((zone) => zone.zone_id === item.zoneId);
    const fallbackRain = parseRainfall(matchingZone?.rainfall_mm);

    byZone[item.zoneId] = {
      temperature: Number.isFinite(item.temperature) ? item.temperature : null,
      precipitation: Number.isFinite(item.precipitation)
        ? item.precipitation
        : fallbackRain,
      updatedAt: item.updatedAt
    };
  }

  return NextResponse.json({
    source: 'open-meteo',
    count: zones.length,
    byZone,
    generatedAt: new Date().toISOString()
  });
}
