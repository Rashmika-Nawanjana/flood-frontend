import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../services/api.dart';
import '../services/socket_service.dart';

class MapPage extends StatefulWidget {
  final String? zoneId;
  const MapPage({super.key, this.zoneId});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  static const Color _blue = Color(0xFF1565C0);
  static const Color _red = Color(0xFFC62828);

  final _mapCtrl = MapController();

  bool _showEvacuation = false;
  bool _showShelters = false;
  bool _locating = false;

  LatLng? _userPos;
  List _shelters = [];
  List _alerts = [];
  List<LatLng> _routePoints = [];
  List<LatLng> _zonePolygon = [];
  Color _zoneColor = const Color(0xFF1565C0); // Default blue
  bool _showingRoute = false;
  bool _calculatingRoute = false;

  StreamSubscription<LiveAlert>? _socketSub;

  @override
  void initState() {
    super.initState();
    _loadData();
    _socketSub = SocketService.instance.alertStream.listen((_) {
      if (mounted) _loadAlerts();
    });
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    super.dispose();
  }

  Future<void> _loadData() async {
    await Future.wait([_loadShelters(), _loadAlerts(), _loadZonePolygon()]);
  }

  Future<void> _loadShelters() async {
    if (widget.zoneId == null) return;
    final data = await ApiService.getShelters(widget.zoneId!);
    if (mounted) setState(() => _shelters = data);
  }

  Future<void> _loadAlerts() async {
    if (widget.zoneId == null) return;
    final data = await ApiService.getAlerts(
        zoneId: widget.zoneId!, severity: 'CRITICAL');
    if (mounted) setState(() => _alerts = data);
  }

  Future<void> _loadZonePolygon() async {
    if (widget.zoneId == null) return;
    try {
      final zone = await ApiService.getZone(widget.zoneId!);
      if (zone != null) {
        // Handle color
        final colorStr = zone['color_code'] as String?;
        final riskLevel = zone['risk_level'] as String?;
        final Color zoneColor = _parseColor(colorStr, riskLevel);

        if (zone['geometry'] != null) {
          final geom = zone['geometry'];
          if (geom['type'] == 'Polygon' && geom['coordinates'] != null) {
            final List rings = geom['coordinates'];
            if (rings.isNotEmpty) {
              final List outerRing = rings[0];
              final List<LatLng> points = [];
              for (final coord in outerRing) {
                final lat = (coord[1] as num).toDouble();
                final lng = (coord[0] as num).toDouble();

                if (lat.isFinite && lng.isFinite) {
                  points.add(LatLng(lat, lng));
                }
              }

              if (mounted && points.isNotEmpty) {
                setState(() {
                  _zonePolygon = points;
                  _zoneColor = zoneColor;
                });

                if (points[0].latitude.isFinite && points[0].longitude.isFinite) {
                  _mapCtrl.move(points[0], 12);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      debugPrint("Error loading zone polygon: $e");
    }
  }

  Color _parseColor(String? hex, String? riskLevel) {
    if (hex != null && hex.isNotEmpty) {
      try {
        final buffer = StringBuffer();
        if (hex.length == 6 || hex.length == 7) buffer.write('ff');
        buffer.write(hex.replaceFirst('#', ''));
        return Color(int.parse(buffer.toString(), radix: 16));
      } catch (_) {}
    }

    // Fallback based on risk level
    switch (riskLevel?.toUpperCase()) {
      case 'CRITICAL':
      case 'EMERGENCY':
        return const Color(0xFFC62828);
      case 'HIGH':
      case 'WARNING':
        return const Color(0xFFEF6C00);
      case 'WATCH':
        return const Color(0xFFF9A825);
      case 'LOW':
        return const Color(0xFF2E7D32);
      default:
        return const Color(0xFF1565C0);
    }
  }

  Future<void> _locateMe() async {
    setState(() => _locating = true);
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 8),
      );
      
      if (pos.latitude.isFinite && pos.longitude.isFinite) {
        final ll = LatLng(pos.latitude, pos.longitude);
        setState(() => _userPos = ll);
        _mapCtrl.move(ll, 14);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not get location')),
        );
      }
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  // ── Marker builders ──────────────────────────────────────────────────────────

  List<Marker> _shelterMarkers() {
    if (!_showShelters) return [];
    return _shelters.map<Marker?>((s) {
      final lat = s['lat'] as double?;
      final lng = s['lng'] as double?;
      if (lat == null || lng == null || !lat.isFinite || !lng.isFinite) return null;
      return Marker(
        point: LatLng(lat, lng),
        width: 36,
        height: 36,
        child: GestureDetector(
          onTap: () => _showShelterSheet(s),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF2E7D32),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
            child:
                const Icon(Icons.shield_outlined, color: Colors.white, size: 18),
          ),
        ),
      );
    }).whereType<Marker>().toList();
  }

  List<Marker> _alertMarkers() {
    if (!_showEvacuation) return [];
    return _alerts.map<Marker?>((a) {
      final lat = a['lat'] as double?;
      final lng = a['lng'] as double?;
      if (lat == null || lng == null || !lat.isFinite || !lng.isFinite) return null;
      return Marker(
        point: LatLng(lat, lng),
        width: 36,
        height: 36,
        child: Container(
          decoration: BoxDecoration(
            color: _red,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
          ),
          child:
              const Icon(Icons.warning_rounded, color: Colors.white, size: 18),
        ),
      );
    }).whereType<Marker>().toList();
  }

  // ── Shelter bottom sheet ─────────────────────────────────────────────────────

  void _showShelterSheet(Map shelter) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2E7D32).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.shield_outlined,
                      color: Color(0xFF2E7D32)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        shelter['name'] ?? 'Shelter',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        shelter['address'] ?? '',
                        style: const TextStyle(
                            fontSize: 13, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if ((shelter['capacity'] ?? '') != '')
              _infoRow(
                  Icons.people_outline, 'Capacity: ${shelter['capacity']}'),
            if ((shelter['status'] ?? '') != '')
              _infoRow(Icons.info_outline, 'Status: ${shelter['status']}'),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _showRouteToShelter(shelter);
                },
                icon: const Icon(Icons.directions, size: 16),
                label: const Text('Get Directions'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showRouteToShelter(Map shelter) async {
    final lat = shelter['lat'] as double?;
    final lng = shelter['lng'] as double?;
    if (lat == null || lng == null) return;

    if (_userPos == null) {
      await _locateMe();
    }
    if (_userPos == null) return;

    setState(() {
      _calculatingRoute = true;
      _showingRoute = true;
    });

    final coords = await ApiService.getRoute(
      _userPos!.latitude,
      _userPos!.longitude,
      lat,
      lng,
    );

    if (mounted) {
      setState(() {
        _routePoints = coords
            .map((c) {
              final lng = (c[0] as num).toDouble();
              final lat = (c[1] as num).toDouble();
              return (lat.isFinite && lng.isFinite) ? LatLng(lat, lng) : null;
            })
            .whereType<LatLng>()
            .toList();
        _calculatingRoute = false;
      });
      if (_routePoints.isNotEmpty) {
        _mapCtrl.move(_userPos!, 14);
      }
    }
  }

  Future<void> _toggleEvacuationRoute() async {
    if (_showingRoute) {
      setState(() {
        _showingRoute = false;
        _routePoints = [];
      });
      return;
    }

    if (_userPos == null) {
      await _locateMe();
    }
    if (_userPos == null) return;

    if (_shelters.isEmpty) {
      await _loadShelters();
    }
    if (_shelters.isEmpty) return;

    setState(() {
      _calculatingRoute = true;
      _showingRoute = true;
    });

    // Find closest shelter
    Map? closest;
    double minDist = double.infinity;

    for (final s in _shelters) {
      final lat = s['lat'] as double?;
      final lng = s['lng'] as double?;
      if (lat == null || lng == null) continue;

      final dist = Geolocator.distanceBetween(
        _userPos!.latitude,
        _userPos!.longitude,
        lat,
        lng,
      );

      if (dist < minDist) {
        minDist = dist;
        closest = s;
      }
    }

    if (closest != null) {
      _showRouteToShelter(closest);
    } else {
      setState(() {
        _calculatingRoute = false;
        _showingRoute = false;
      });
    }
  }

  Widget _infoRow(IconData icon, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(
          children: [
            Icon(icon, size: 16, color: Colors.grey),
            const SizedBox(width: 8),
            Text(text, style: const TextStyle(fontSize: 13)),
          ],
        ),
      );

  // ── UI ───────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // ── Map ───────────────────────────────────────────────────────
          FlutterMap(
            mapController: _mapCtrl,
            options: MapOptions(
              initialCenter: const LatLng(7.8731, 80.7718), // Sri Lanka center
              initialZoom: 8,
            ),
            children: [
              TileLayer(
                urlTemplate:
                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.floodsense.lk',
              ),
              if (_zonePolygon.isNotEmpty)
                PolygonLayer(
                  polygons: <Polygon>[
                    Polygon(
                      points: _zonePolygon,
                      color: _zoneColor.withOpacity(0.15),
                      borderStrokeWidth: 2,
                      borderColor: _zoneColor,
                    ),
                  ],
                ),
              if (_showingRoute && _routePoints.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: _routePoints,
                      color: _blue,
                      strokeWidth: 5,
                      borderColor: Colors.white,
                      borderStrokeWidth: 2,
                    ),
                  ],
                ),
              MarkerLayer(
                markers: [
                  ..._shelterMarkers(),
                  ..._alertMarkers(),
                  if (_userPos != null)
                    Marker(
                      point: _userPos!,
                      width: 40,
                      height: 40,
                      child: Container(
                        decoration: BoxDecoration(
                          color: _blue.withOpacity(0.2),
                          shape: BoxShape.circle,
                          border: Border.all(color: _blue, width: 2),
                        ),
                        child: const Icon(Icons.person_pin_circle,
                            color: _blue, size: 22),
                      ),
                    ),
                ],
              ),
            ],
          ),

          // ── Top controls ──────────────────────────────────────────────
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 16,
            right: 16,
            child: Row(
              children: [
                // Evacuation toggle
                Expanded(
                  child: _MapButton(
                    icon: _showEvacuation
                        ? Icons.warning_rounded
                        : Icons.directions_run,
                    label: _showEvacuation ? 'Hide Alerts' : 'Show Alerts',
                    active: _showEvacuation,
                    activeColor: _red,
                    onTap: () =>
                        setState(() => _showEvacuation = !_showEvacuation),
                  ),
                ),
                const SizedBox(width: 8),

                // Shelter toggle
                Expanded(
                  child: _MapButton(
                    icon: Icons.shield_outlined,
                    label: _showShelters ? 'Hide Shelters' : 'Shelters',
                    active: _showShelters,
                    activeColor: const Color(0xFF2E7D32),
                    onTap: () =>
                        setState(() => _showShelters = !_showShelters),
                  ),
                ),
                const SizedBox(width: 8),

                // Evacuation Route toggle
                Expanded(
                  child: _MapButton(
                    icon: Icons.directions,
                    label: _showingRoute ? 'Hide Route' : 'Evac Route',
                    active: _showingRoute,
                    activeColor: _blue,
                    loading: _calculatingRoute,
                    onTap: _toggleEvacuationRoute,
                  ),
                ),
              ],
            ),
          ),

          // ── Locate-me FAB ─────────────────────────────────────────────
          Positioned(
            bottom: 28,
            right: 16,
            child: FloatingActionButton(
              onPressed: _locating ? null : _locateMe,
              backgroundColor: Colors.white,
              foregroundColor: _blue,
              elevation: 4,
              child: _locating
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.my_location),
            ),
          ),

          // ── Legend ────────────────────────────────────────────────────
          Positioned(
            bottom: 28,
            left: 16,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _legendRow(_red, Icons.warning_rounded, 'Alert zone'),
                  const SizedBox(height: 4),
                  _legendRow(const Color(0xFF2E7D32), Icons.shield_outlined,
                      'Safe shelter'),
                  const SizedBox(height: 4),
                  _legendRow(_blue, Icons.person_pin_circle, 'You'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _legendRow(Color color, IconData icon, String label) => Row(
        children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 6),
          Text(label,
              style: const TextStyle(fontSize: 11, color: Color(0xFF374151))),
        ],
      );
}

// ── Compact map toggle button ─────────────────────────────────────────────────

class _MapButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final Color activeColor;
  final bool loading;
  final VoidCallback onTap;

  const _MapButton({
    required this.icon,
    required this.label,
    required this.active,
    required this.activeColor,
    this.loading = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: loading ? null : onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            color: active ? activeColor : Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.12),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              if (loading)
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              else
                Icon(icon,
                    size: 16,
                    color: active ? Colors.white : const Color(0xFF374151)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: active ? Colors.white : const Color(0xFF374151),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}