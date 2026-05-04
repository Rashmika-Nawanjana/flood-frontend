import provinceGeojson from './data/sri_lanka_provinces.json';

export const provinceStyles = {
  Western: '#1565C0',
  Central: '#2E7D32',
  Southern: '#F9A825',
  Northern: '#C62828',
  Eastern: '#6D4C41',
  'North Western': '#EF6C00',
  'North Central': '#00838F',
  Uva: '#5E35B1',
  Sabaragamuwa: '#455A64'
};

const CANONICAL_BY_NORMALIZED = {
  western: 'Western',
  central: 'Central',
  southern: 'Southern',
  northern: 'Northern',
  eastern: 'Eastern',
  'north western': 'North Western',
  'north central': 'North Central',
  uva: 'Uva',
  sabaragamuwa: 'Sabaragamuwa'
};

function normalizeProvinceName(value) {
  if (!value) return '';
  const compact = String(value).toLowerCase().replace(/province/g, '').replace(/\s+/g, ' ').trim();
  return CANONICAL_BY_NORMALIZED[compact] || '';
}

function getCookieValue(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : '';
}

export function setAccessCookies(role, province = '') {
  if (typeof document === 'undefined') return;
  document.cookie = `flood_role=${encodeURIComponent(role)}; path=/; samesite=lax`;
  document.cookie = `flood_province=${encodeURIComponent(province)}; path=/; samesite=lax`;
}

export function clearAccessCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'flood_role=; Max-Age=0; path=/; samesite=lax';
  document.cookie = 'flood_province=; Max-Age=0; path=/; samesite=lax';
}

const normalizedFeatures = (provinceGeojson?.features || [])
  .map((feature) => {
    const props = feature?.properties || {};
    const originalName = props.shapeName || props.name || props.NAME || props.NAME_1 || props.admin_name || props.province || '';
    const province = normalizeProvinceName(originalName);
    if (!province) return null;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        province
      }
    };
  })
  .filter(Boolean);

export const provinceFeatures = {
  type: 'FeatureCollection',
  features: normalizedFeatures
};

export const provinceOptions = Object.keys(provinceStyles);

function pointInRing(point, ring) {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, geometry) {
  if (!geometry || !geometry.coordinates) return false;
  const coords = geometry.coordinates;
  // use first ring for simple polygons, or test each ring for MultiPolygon
  if (geometry.type === 'Polygon') {
    return pointInRing(point, coords[0]);
  }
  if (geometry.type === 'MultiPolygon') {
    for (const poly of coords) {
      if (pointInRing(point, poly[0])) return true;
    }
  }
  return false;
}

export function computeProvinceStats(zones) {
  const stats = {};
  for (const feat of provinceFeatures.features) {
    const name = feat.properties.province;
    stats[name] = { zoneCount: 0, affectedPopulation: 0, highRiskCount: 0 };
  }

  for (const zone of zones) {
    const pt = zone.center;
    let matched = false;
    for (const feat of provinceFeatures.features) {
      if (pointInPolygon(pt, feat.geometry)) {
        const name = feat.properties.province;
        stats[name].zoneCount += 1;
        stats[name].affectedPopulation += zone.affected_population || 0;
        if (zone.risk_level === 'high' || zone.risk_level === 'critical') stats[name].highRiskCount += 1;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // zones that don't match any province are ignored for now
    }
  }

  return stats;
}

export function getAccessProfile() {
  if (typeof window === 'undefined') {
    return { role: 'public', province: '' };
  }

  const cookieRole = getCookieValue('flood_role');
  const cookieProvince = getCookieValue('flood_province');
  const role = cookieRole || window.localStorage.getItem('userRole') || 'public';
  const province = cookieProvince || window.localStorage.getItem('userProvince') || '';

  if (role) {
    window.localStorage.setItem('userRole', role);
  }
  if (province) {
    window.localStorage.setItem('userProvince', province);
  }

  return { role, province };
}

export function canAccessRegionalMap(profile) {
  return profile.role === 'admin' || profile.role === 'regional_officer';
}

export function getProvinceFilter(profile) {
  if (profile.role === 'admin') {
    return null;
  }

  if (profile.role === 'regional_officer') {
    return normalizeProvinceName(profile.province);
  }

  return '';
}
