// Data is now loaded from the backend API (/api/v1/zones, /api/v1/sensors)
import fallbackZoneData from './data/floodzones.json';

export const riskColors = {
  low: '#2E7D32',
  medium: '#F9A825',
  high: '#EF6C00',
  critical: '#C62828'
};

const trendIcon = {
  rising: '↑ Rising',
  stable: '→ Stable',
  falling: '↓ Falling'
};

const trendColor = {
  rising: '#C62828',
  stable: '#F9A825',
  falling: '#2E7D32'
};

const LOW_RISK_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export const WEATHER_REFRESH_MS = 5 * 60 * 1000;
export const DEFAULT_CENTER = [80.6333, 7.2944];
export const SRI_LANKA_VIEW_BOUNDS = [
  [79.45, 5.75],
  [82.05, 10.05]
];
export const DEFAULT_BOUNDS = [
  [78, 2.85],
  [83, 12.85]
];

export const MAPBOX_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11'
};

function shouldShowZone(zone) {
  if (zone.risk_level !== 'low') return true;
  const lastUpdated = new Date(zone.last_updated).getTime();
  return Date.now() - lastUpdated < LOW_RISK_TIMEOUT_MS;
}

function getRiskScore(level) {
  const scores = {
    low: 0.25,
    medium: 0.5,
    high: 0.75,
    critical: 1
  };

  return scores[level] || 0.1;
}

function parseRainfall(rainfallText) {
  if (!rainfallText) return 0;
  const parsed = parseFloat(String(rainfallText).replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePointCoordinates(point) {
  if (Array.isArray(point?.center) && point.center.length >= 2) {
    return point.center;
  }

  if (Number.isFinite(point?.lng) && Number.isFinite(point?.lat)) {
    return [point.lng, point.lat];
  }

  if (Array.isArray(point?.coordinates) && point.coordinates.length >= 2) {
    return point.coordinates;
  }

  return [0, 0];
}

function getPointCoordinates(zone, live = {}) {
  if (Number.isFinite(live.lng) && Number.isFinite(live.lat)) {
    return [live.lng, live.lat];
  }

  if (Array.isArray(zone.center) && zone.center.length >= 2) {
    return zone.center;
  }

  if (zone.geometry?.type === 'Point' && Array.isArray(zone.geometry.coordinates)) {
    return zone.geometry.coordinates;
  }

  const polygon = zone.geometry?.type === 'Polygon' ? zone.geometry.coordinates?.[0] : null;
  if (Array.isArray(polygon) && polygon.length > 0) {
    const centroid = polygon.reduce(
      (acc, coordinate) => {
        acc[0] += coordinate[0];
        acc[1] += coordinate[1];
        return acc;
      },
      [0, 0]
    );

    return [centroid[0] / polygon.length, centroid[1] / polygon.length];
  }

  return [0, 0];
}

function createCircle(center, radiusKm, points = 64) {
  const coords = [];
  const lngScale = Math.cos((center[1] * Math.PI) / 180);
  for (let i = 0; i < points; i++) {
    const angle = (i * 360) / points;
    const rad = (angle * Math.PI) / 180;
    const lng = center[0] + (radiusKm / (111 * lngScale)) * Math.cos(rad);
    const lat = center[1] + (radiusKm / 111) * Math.sin(rad);
    coords.push([lng, lat]);
  }
  coords.push(coords[0]);
  return coords;
}

export function buildPopupHTML(props, overlapCount) {
  const risk = props.risk_level;
  const trend = props.trend;
  const color = riskColors[risk] || '#ccc';
  const tColor = trendColor[trend] || '#ccc';
  const tLabel = trendIcon[trend] || trend;

  return `
    <div style="font-family:sans-serif;min-width:220px;padding:4px">

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <strong style="font-size:15px;color:#1F2937">${props.name}</strong>
        <span style="
          background:${color};
          color:#fff;
          font-size:11px;
          font-weight:600;
          padding:2px 8px;
          border-radius:99px;
          text-transform:uppercase;
        ">${risk}</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12.5px;margin-bottom:8px">
        <div style="background:#F5F7FA;border-radius:6px;padding:6px">
          <div style="color:#6B7280;margin-bottom:2px">Water level</div>
          <div style="font-weight:600;color:#6B7280">${props.water_level}</div>
        </div>
        <div style="background:#F5F7FA;border-radius:6px;padding:6px">
          <div style="color:#6B7280;margin-bottom:2px">Rainfall</div>
          <div style="font-weight:600;color:#6B7280">${props.rainfall_mm}</div>
        </div>
        <div style="background:#F5F7FA;border-radius:6px;padding:6px">
          <div style="color:#6B7280;margin-bottom:2px">Trend</div>
          <div style="font-weight:600;color:${tColor}">${tLabel}</div>
        </div>
        <div style="background:#F5F7FA;border-radius:6px;padding:6px">
          <div style="color:#6B7280;margin-bottom:2px">Affected</div>
          <div style="font-weight:600;color:#6B7280">${props.affected_population.toLocaleString()} people</div>
        </div>
      </div>

      <div style="font-size:11px;color:#6B7280;display:flex;justify-content:space-between">
        <span>Sensor: ${props.sensor_id}</span>
        <span>Updated: ${new Date(props.last_updated).toLocaleString()}</span>
      </div>

      ${overlapCount > 1
        ? `<div style="margin-top:6px;font-size:11px;color:#6B7280;border-top:1px solid #E5E7EB;padding-top:6px">
            ⚠️ ${overlapCount} zones overlap at this point
           </div>`
        : ''}
    </div>
  `;
}

export async function fetchZones() {
  try {
    const res = await fetch('/api/v1/zones');
    if (!res.ok) return fallbackZoneData;
    const payload = await res.json();
    const data = Array.isArray(payload?.data) ? payload.data : [];
    return data.length ? data : fallbackZoneData;
  } catch (e) {
    return fallbackZoneData;
  }
}

export async function fetchVisibleZones() {
  const zones = await fetchZones();
  return zones.filter((z) => z.active !== false && shouldShowZone(z));
}

export function zonesToFeatureCollection(zones = []) {
  return {
    type: 'FeatureCollection',
    features: zones.map((zone) => ({
      type: 'Feature',
      properties: {
        zone_id: zone.zone_id || zone.zoneId || zone.id,
        name: zone.zone_name || zone.name || zone.zoneId,
        risk_level: zone.risk_level || zone.riskLevel || 'low',
        water_level: zone.current_conditions?.avg_water_level_m ?? null,
        rainfall_mm: zone.current_conditions?.total_rainfall_mm ?? null,
        affected_population: zone.population_at_risk ?? 0,
        sensor_id: (zone.sensors_in_zone && zone.sensors_in_zone[0]) || null,
        trend: zone.current_conditions?.trend ? String(zone.current_conditions.trend).toLowerCase() : 'stable',
        last_updated: zone.last_updated || zone.lastUpdated || null
      },
      geometry: zone.geometry || (Array.isArray(zone.center)
        ? {
            type: 'Polygon',
            coordinates: [createCircle(zone.center, zone.radius_km || 4)]
          }
        : null)
    }))
  };
}

export function zonesToHeatPoints(zones = []) {
  const maxAffectedPopulation = Math.max(...zones.map((z) => z.population_at_risk || 0), 1);

  return {
    type: 'FeatureCollection',
    features: zones.map((zone) => ({
      type: 'Feature',
      properties: {
        zone_id: zone.zone_id,
        name: zone.zone_name || zone.name,
        risk_level: zone.risk_level,
        affected_population: zone.population_at_risk || 0,
        heat_weight: Math.max((zone.population_at_risk || 0) / maxAffectedPopulation, 0.05),
        risk_score: getRiskScore(zone.risk_level)
      },
      geometry: {
        type: 'Point',
        coordinates: getPointCoordinates(zone)
      }
    }))
  };
}

export function buildWeatherFeatureCollections(zones = [], weatherByZone = {}) {
  const temperatureFeatures = zones.map((zone) => {
    const zid = zone.zone_id || zone.zone_id;
    const live = weatherByZone[zid];
    const tempC = Number.isFinite(live?.temperature) ? live.temperature : 27;

    return {
      type: 'Feature',
      properties: {
        zone_id: zid,
        name: zone.zone_name || zone.name,
        temperature_c: tempC,
        updated_at: live?.updatedAt || null
      },
      geometry: {
        type: 'Point',
        coordinates: getPointCoordinates(zone, live)
      }
    };
  });

  const rainfallFeatures = zones.map((zone) => {
    const zid = zone.zone_id || zone.zone_id;
    const live = weatherByZone[zid];
    const rainMm = Number.isFinite(live?.precipitation)
      ? live.precipitation
      : parseRainfall(zone.current_conditions?.total_rainfall_mm || zone.rainfall_mm);

    return {
      type: 'Feature',
      properties: {
        zone_id: zid,
        name: zone.zone_name || zone.name,
        rain_mm: rainMm,
        updated_at: live?.updatedAt || null
      },
      geometry: {
        type: 'Point',
        coordinates: getPointCoordinates(zone, live)
      }
    };
  });

  return {
    temperature: {
      type: 'FeatureCollection',
      features: temperatureFeatures
    },
    rainfall: {
      type: 'FeatureCollection',
      features: rainfallFeatures
    }
  };
}

export async function fetchLiveWeatherForZones(zones = []) {
  // Prefer backend aggregated endpoint if available
  try {
    const res = await fetch('/api/v1/sensors');
    if (!res.ok) throw new Error('sensors fetch failed');
    const payload = await res.json();
    const sensors = Array.isArray(payload?.data) ? payload.data : [];

    const byZone = {};
    for (const s of sensors) {
      const zid = s.location?.zone_id || s.zone_id || null;
      if (!zid) continue;
      const readings = s.readings || s.current_reading || {};
      const status = s.status || s.device_health || {};
      byZone[zid] = {
        temperature: Number.isFinite(readings.temperature_c) ? readings.temperature_c : (readings.temperature || null),
        precipitation: Number.isFinite(readings.rainfall_mm_per_hr) ? readings.rainfall_mm_per_hr : (readings.rainfall_mm || null),
        updatedAt: status.last_seen || status.last_maintenance || null
      };
    }

    return byZone;
  } catch (e) {
    // Fallback: return empty mapping
    return {};
  }
}

export async function fetchLiveWeatherForLocations(locations = []) {
  try {
    const validLocations = locations.filter((location) =>
      location && typeof location.zone_id === 'string' && normalizePointCoordinates(location).length >= 2
    );

    if (!validLocations.length) return {};

    const res = await fetch('/maps/api/weather/live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      body: JSON.stringify({ zones: validLocations })
    });

    if (!res.ok) throw new Error('weather_live_fetch_failed');
    const payload = await res.json();
    return payload?.byZone && typeof payload.byZone === 'object' ? payload.byZone : {};
  } catch {
    return {};
  }
}

export function buildPointWeatherFeatureCollections(points = [], weatherByPoint = {}) {
  const temperatureFeatures = points.map((point) => {
    const live = weatherByPoint[point.zone_id];
    const temperature = Number.isFinite(live?.temperature) ? live.temperature : 27;
    const tempHeat = Math.max(temperature, 20);

    return {
      type: 'Feature',
      properties: {
        zone_id: point.zone_id,
        name: point.name,
        temperature_c: temperature,
        temp_heat: tempHeat,
        updated_at: live?.updatedAt || null
      },
      geometry: {
        type: 'Point',
        coordinates: normalizePointCoordinates(point)
      }
    };
  });

  const rainfallFeatures = points.map((point) => {
    const live = weatherByPoint[point.zone_id];
    const rainfall = Number.isFinite(live?.precipitation) ? live.precipitation : 0;
    const rainHeat = Math.max(rainfall, 1);

    return {
      type: 'Feature',
      properties: {
        zone_id: point.zone_id,
        name: point.name,
        rain_mm: rainfall,
        rain_heat: rainHeat,
        updated_at: live?.updatedAt || null
      },
      geometry: {
        type: 'Point',
        coordinates: normalizePointCoordinates(point)
      }
    };
  });

  return {
    temperature: {
      type: 'FeatureCollection',
      features: temperatureFeatures
    },
    rainfall: {
      type: 'FeatureCollection',
      features: rainfallFeatures
    }
  };
}
