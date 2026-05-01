import { NextResponse } from 'next/server';

function parseCoordinatePair(value) {
  if (!value) return null;

  const parts = String(value)
    .split(',')
    .map((part) => Number(part.trim()));

  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  return parts;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const profile = searchParams.get('profile') || 'walking';
  const start = searchParams.get('start') || searchParams.get('origin');
  const end = searchParams.get('end') || searchParams.get('destination');

  if (!start || !end) {
    return NextResponse.json({ error: 'origin and destination query params required' }, { status: 400 });
  }

  const originCoords = parseCoordinatePair(start);
  const destinationCoords = parseCoordinatePair(end);

  if (!originCoords || !destinationCoords) {
    return NextResponse.json({ error: 'invalid coordinate pair supplied' }, { status: 400 });
  }

  // Use free routing services by default. Mapbox stays available as an opt-in
  // server-side fallback if a token is configured.
  const mapboxToken = process.env.MAPBOX_DIRECTIONS_TOKEN;
  const allowed = new Set(['driving', 'walking', 'cycling']);
  const p = allowed.has(profile) ? profile : 'walking';
  const origin = `${originCoords[0]},${originCoords[1]}`;
  const destination = `${destinationCoords[0]},${destinationCoords[1]}`;

  const freeProfile = p === 'walking' ? 'foot' : p === 'driving' ? 'car' : 'bike';
  const freeUrls = [
    `https://router.project-osrm.org/route/v1/${freeProfile}/${origin};${destination}?overview=full&geometries=geojson&steps=true`,
    `https://routing.openstreetmap.de/routed-${freeProfile}/route/v1/${freeProfile}/${origin};${destination}?overview=full&geometries=geojson&steps=true`
  ];
  const mapboxUrl = mapboxToken
    ? `https://api.mapbox.com/directions/v5/mapbox/${p}/${origin};${destination}?geometries=geojson&overview=full&access_token=${encodeURIComponent(mapboxToken)}`
    : null;

  try {
    for (const freeUrl of freeUrls) {
      const res = await fetch(freeUrl);

      if (res.ok) {
        const payload = await res.json();
        return NextResponse.json(payload);
      }

      if (!mapboxUrl) {
        const text = await res.text();
        if (freeUrl === freeUrls[freeUrls.length - 1]) {
          return NextResponse.json({ error: 'directions error', details: text }, { status: 502 });
        }
      }
    }

    if (mapboxUrl) {
      const mapboxRes = await fetch(mapboxUrl);
      if (!mapboxRes.ok) {
        const text = await mapboxRes.text();
        return NextResponse.json({ error: 'directions error', details: text }, { status: 502 });
      }

      const payload = await mapboxRes.json();
      return NextResponse.json(payload);
    }

    return NextResponse.json({ error: 'directions error', details: 'all free route backends failed' }, { status: 502 });
  } catch (err) {
    return NextResponse.json({ error: 'fetch_failed', message: String(err) }, { status: 502 });
  }
}
