'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  DEFAULT_CENTER,
  SRI_LANKA_VIEW_BOUNDS,
  MAPBOX_STYLES
} from '../mapData';
import { fetchVisibleZones } from '../mapData';
import {
  provinceFeatures,
  provinceStyles,
  provinceOptions,
  getAccessProfile,
  canAccessRegionalMap,
  getProvinceFilter,
  computeProvinceStats,
  setAccessCookies,
  clearAccessCookies
} from './provinceData';
// visible zones are fetched dynamically via fetchVisibleZones

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function fitSriLanka(map) {
  map.fitBounds(SRI_LANKA_VIEW_BOUNDS, {
    padding: { top: 36, right: 28, bottom: 36, left: 28 },
    duration: 0
  });
  map.setMinZoom(map.getZoom());
}

function buildSensorFeatureCollection(sensors = []) {
  return {
    type: 'FeatureCollection',
    features: sensors
      .filter((sensor) => Number.isFinite(sensor?.location?.lng) && Number.isFinite(sensor?.location?.lat))
      .map((sensor) => {
        const readings = sensor.readings || sensor.current_reading || {};
        const status = sensor.status || sensor.device_health || {};

        return {
          type: 'Feature',
          properties: {
            sensor_id: sensor.sensor_id || sensor.id,
            name: sensor.name || sensor.sensor_name || 'Sensor',
            zone_name: sensor.location?.zone_name || sensor.zone_name || '',
            water_level_m: readings.water_level_m ?? readings.water_level ?? null,
            rainfall_mm_per_hr: readings.rainfall_mm_per_hr ?? readings.rainfall_mm ?? null,
            temperature_c: readings.temperature_c ?? readings.temperature ?? null,
            battery_percent: status.battery_percent ?? null,
            signal_strength_dbm: status.signal_strength_dbm ?? null,
            last_seen: status.last_seen || status.updated_at || null
          },
          geometry: {
            type: 'Point',
            coordinates: [sensor.location.lng, sensor.location.lat]
          }
        };
      })
  };
}

export default function RegionalOfficerMapPage() {
  const router = useRouter();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState({ role: 'public', province: '' });

  useEffect(() => {
    setMounted(true);
    setProfile(getAccessProfile());
  }, []);

  const allowed = useMemo(() => canAccessRegionalMap(profile), [profile]);
  const provinceFilter = useMemo(() => getProvinceFilter(profile), [profile]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [provinceStats, setProvinceStats] = useState({});

  useEffect(() => {
    if (!mounted || !allowed) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLES.light,
      center: DEFAULT_CENTER,
      zoom: 3.7,
      minZoom: 1
    });
    mapRef.current = map;

    const handleResize = () => {
      map.resize();
      fitSriLanka(map);
    };

    const provinceGeojson = provinceFilter === null
      ? provinceFeatures
      : {
          type: 'FeatureCollection',
          features: provinceFeatures.features.filter(
            (feature) => feature.properties.province === provinceFilter
          )
        };

    map.on('load', () => {
      fitSriLanka(map);

      map.addSource('provinces', {
        type: 'geojson',
        data: provinceGeojson
      });

      if (profile.role === 'admin') {
        (async () => {
          try {
            const response = await fetch('/api/v1/sensors');
            if (!response.ok) return;

            const payload = await response.json();
            const sensors = Array.isArray(payload?.data) ? payload.data : [];
            const sensorGeojson = buildSensorFeatureCollection(sensors);

            map.addSource('sensor-locations', {
              type: 'geojson',
              data: sensorGeojson
            });

            map.addLayer({
              id: 'sensor-locations-ring',
              type: 'circle',
              source: 'sensor-locations',
              paint: {
                'circle-radius': 8,
                'circle-color': '#0F766E',
                'circle-opacity': 0.18,
                'circle-stroke-color': '#0F766E',
                'circle-stroke-width': 2
              }
            });

            map.addLayer({
              id: 'sensor-locations-point',
              type: 'circle',
              source: 'sensor-locations',
              paint: {
                'circle-radius': 4.5,
                'circle-color': '#14B8A6',
                'circle-stroke-color': '#FFFFFF',
                'circle-stroke-width': 1.5
              }
            });

            map.addLayer({
              id: 'sensor-locations-label',
              type: 'symbol',
              source: 'sensor-locations',
              layout: {
                'text-field': ['get', 'name'],
                'text-size': 11,
                'text-offset': [0, 1.1],
                'text-anchor': 'top'
              },
              paint: {
                'text-color': '#0F172A',
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 1
              }
            });

            map.on('click', 'sensor-locations-point', (event) => {
              const feature = event.features?.[0];
              if (!feature) return;

              new mapboxgl.Popup({ maxWidth: '280px' })
                .setLngLat(event.lngLat)
                .setHTML(`
                  <div style="font-family:sans-serif;min-width:220px">
                    <strong style="color:#1F2937">${feature.properties.name}</strong><br/>
                    <span style="color:#6B7280">${feature.properties.zone_name || 'No zone'}</span><br/>
                    <span style="color:#0F766E">Water: ${feature.properties.water_level_m ?? 'n/a'} m</span><br/>
                    <span style="color:#0F766E">Rain: ${feature.properties.rainfall_mm_per_hr ?? 'n/a'} mm/hr</span><br/>
                    <span style="color:#6B7280">Temp: ${feature.properties.temperature_c ?? 'n/a'} °C</span><br/>
                    <span style="color:#6B7280">Battery: ${feature.properties.battery_percent ?? 'n/a'}%</span><br/>
                    <span style="color:#6B7280">Signal: ${feature.properties.signal_strength_dbm ?? 'n/a'} dBm</span>
                  </div>
                `)
                .addTo(map);
            });

            map.on('mouseenter', 'sensor-locations-point', () => {
              map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', 'sensor-locations-point', () => {
              map.getCanvas().style.cursor = '';
            });
          } catch {
            // ignore sensor load errors in admin view
          }
        })();
      }

      map.addLayer({
        id: 'province-fills',
        type: 'fill',
        source: 'provinces',
        paint: {
          'fill-color': [
            'match', ['get', 'province'],
            'Western', provinceStyles.Western,
            'Central', provinceStyles.Central,
            'Southern', provinceStyles.Southern,
            'Northern', provinceStyles.Northern,
            'Eastern', provinceStyles.Eastern,
            'North Western', provinceStyles['North Western'],
            'North Central', provinceStyles['North Central'],
            'Uva', provinceStyles.Uva,
            'Sabaragamuwa', provinceStyles.Sabaragamuwa,
            '#94A3B8'
          ],
          'fill-opacity': 0.55
        }
      });

      map.addLayer({
        id: 'province-borders',
        type: 'line',
        source: 'provinces',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 1.5
        }
      });

      map.addLayer({
        id: 'province-labels',
        type: 'symbol',
        source: 'provinces',
        layout: {
          'text-field': ['get', 'province'],
          'text-size': 12,
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': false
        },
        paint: {
          'text-color': '#0F172A',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.25
        }
      });

      // highlight layer for selected province
      map.addLayer({
        id: 'province-highlight',
        type: 'line',
        source: 'provinces',
        paint: {
          'line-color': '#111827',
          'line-width': 3
        }
      });

      map.on('click', 'province-fills', (event) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const province = feature.properties.province;
        const color = provinceStyles[province] || '#1565C0';

        new mapboxgl.Popup({ maxWidth: '260px' })
          .setLngLat(event.lngLat)
          .setHTML(`
            <div style="font-family:sans-serif;min-width:180px">
              <strong style="color:#1F2937">${province}</strong><br/>
              <span style="color:${color}">Regional access granted</span><br/>
              <span style="color:#6B7280;font-size:12px">${profile.role === 'admin' ? 'Admin can view all provinces.' : 'Regional officers can view only their assigned province.'}</span>
            </div>
          `)
          .addTo(map);
      });

      map.on('mouseenter', 'province-fills', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'province-fills', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, [allowed, mounted, provinceFilter, profile.role]);

  useEffect(() => {
    // compute province stats client-side from visible zones fetched from API
    (async () => {
      try {
        const zones = await fetchVisibleZones();
        // ensure zones have a simple `center` for province matching
        const normalized = zones.map((z) => {
          const coords = z.geometry?.coordinates?.[0]?.[0];
          let center = z.center;
          if (!center && Array.isArray(z.geometry?.coordinates?.[0])) {
            const ring = z.geometry.coordinates[0];
            const avg = ring.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
            center = [avg[0] / ring.length, avg[1] / ring.length];
          }
          return {
            ...z,
            center: center || [0, 0],
            affected_population: z.population_at_risk || z.affected_population || 0
          };
        });

        const stats = computeProvinceStats(normalized);
        setProvinceStats(stats);
      } catch (e) {
        setProvinceStats({});
      }
    })();
  }, [mounted]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Show only the selected province when set; clear filters to show all when empty
    try {
      if (!selectedProvince) {
        if (map.getLayer('province-fills')) map.setFilter('province-fills', null);
        if (map.getLayer('province-borders')) map.setFilter('province-borders', null);
        if (map.getLayer('province-highlight')) map.setFilter('province-highlight', null);
      } else {
        if (map.getLayer('province-fills')) map.setFilter('province-fills', ['==', ['get', 'province'], selectedProvince]);
        if (map.getLayer('province-borders')) map.setFilter('province-borders', ['==', ['get', 'province'], selectedProvince]);
        if (map.getLayer('province-highlight')) map.setFilter('province-highlight', ['==', ['get', 'province'], selectedProvince]);
      }
    } catch (e) {
      // ignore transient map errors
    }

    // always fit to the selected province bounds when present
    if (selectedProvince) {
      const feat = provinceFeatures.features.find((f) => f.properties.province === selectedProvince);
      if (feat) {
        let minX = 360, minY = 360, maxX = -360, maxY = -360;
        const rings = feat.geometry.type === 'MultiPolygon' ? feat.geometry.coordinates.flat(1) : feat.geometry.coordinates;
        const ring = Array.isArray(rings[0][0]) ? rings[0] : rings;
        for (const c of ring) {
          minX = Math.min(minX, c[0]);
          minY = Math.min(minY, c[1]);
          maxX = Math.max(maxX, c[0]);
          maxY = Math.max(maxY, c[1]);
        }
        try {
          map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 24, duration: 600 });
        } catch (e) {
          // ignore
        }
      }
    }
  }, [selectedProvince]);

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F5F7FA', color: '#1F2937' }}>
        Loading regional map...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F7FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}>
          <button
            type="button"
            onClick={() => router.push('/maps/map')}
            style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#1F2937', borderRadius: 10, padding: '8px 12px', fontSize: 14, cursor: 'pointer' }}
          >
            Back to Dashboard
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>Regional Officers Map</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>Restricted to admin or assigned regional officers</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ maxWidth: 620, width: '100%', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24, color: '#1F2937' }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Access denied</div>
            <p style={{ margin: 0, color: '#6B7280', lineHeight: 1.6 }}>
              This map is only for admins and regional officers. Public users cannot open it.
            </p>
            <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setAccessCookies('admin', '');
                    window.localStorage.setItem('userRole', 'admin');
                    window.localStorage.removeItem('userProvince');
                    window.location.reload();
                  }}
                  style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#1F2937', borderRadius: 10, padding: '8px 12px', fontSize: 14, cursor: 'pointer' }}
                >
                  Open as Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const province = provinceOptions[0];
                    setAccessCookies('regional_officer', province);
                    window.localStorage.setItem('userRole', 'regional_officer');
                    window.localStorage.setItem('userProvince', province);
                    window.location.reload();
                  }}
                  style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#1F2937', borderRadius: 10, padding: '8px 12px', fontSize: 14, cursor: 'pointer' }}
                >
                  Open as Regional Officer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAccessCookies();
                    window.localStorage.removeItem('userRole');
                    window.localStorage.removeItem('userProvince');
                    window.location.reload();
                  }}
                  style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#1F2937', borderRadius: 10, padding: '8px 12px', fontSize: 14, cursor: 'pointer' }}
                >
                  Clear Role
                </button>
              </div>
              <label style={{ display: 'grid', gap: 6, fontSize: 13, color: '#6B7280' }}>
                Province for regional officer
                <select
                  defaultValue={provinceOptions[0]}
                  onChange={(event) => {
                    setAccessCookies('regional_officer', event.target.value);
                    window.localStorage.setItem('userProvince', event.target.value);
                  }}
                  style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 10px', fontSize: 14, color: '#1F2937', background: '#FFFFFF' }}
                >
                  {provinceOptions.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F7FA' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => router.push('/maps/map')}
            style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#1F2937', borderRadius: 10, padding: '8px 12px', fontSize: 14, cursor: 'pointer' }}
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              const map = mapRef.current;
              if (!map) return;
              fitSriLanka(map);
            }}
            style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#1F2937', borderRadius: 10, padding: '8px 12px', fontSize: 14, cursor: 'pointer' }}
          >
            Reset View
          </button>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
            {profile.role === 'admin' ? 'Admin Sensor Map' : 'Regional Officers Map'}
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            {profile.role === 'admin'
              ? 'Admin view: all 9 provinces plus sensor locations'
              : `Regional officer view: ${profile.province}`}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <aside style={{ width: 320, borderRight: '1px solid #E5E7EB', background: '#FFFFFF', padding: 12, overflow: 'auto' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Provinces</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {provinceFeatures.features.map((feat) => {
              const name = feat.properties.province;
              if (provinceFilter && provinceFilter !== name) return null;
              const s = provinceStats[name] || { zoneCount: 0, affectedPopulation: 0, highRiskCount: 0 };
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedProvince((prev) => (prev === name ? '' : name))}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: selectedProvince === name ? '2px solid #111827' : '1px solid #E5E7EB',
                    background: selectedProvince === name ? '#F8FAFC' : '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700 }}>{name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{s.zoneCount} zones • {s.affectedPopulation.toLocaleString()} people affected</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: s.highRiskCount ? '#C62828' : '#6B7280' }}>{s.highRiskCount} high</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{provinceStyles[name] ? ' ' : ''}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
        <div ref={mapContainerRef} style={{ flex: 1, minHeight: 0 }} />
      </div>
    </div>
  );
}
