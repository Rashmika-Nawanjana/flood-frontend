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
    await Future.wait([_loadShelters(), _loadAlerts()]);
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
      final ll = LatLng(pos.latitude, pos.longitude);
      setState(() => _userPos = ll);
      _mapCtrl.move(ll, 14);
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
      if (lat == null || lng == null) return null;
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
      if (lat == null || lng == null) return null;
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
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.directions, size: 16),
                label: const Text('Get Directions'),
              ),
            ),
          ],
        ),
      ),
    );
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
                _MapButton(
                  icon: _showEvacuation
                      ? Icons.warning_rounded
                      : Icons.directions_run,
                  label: _showEvacuation ? 'Hide Alerts' : 'Show Alerts',
                  active: _showEvacuation,
                  activeColor: _red,
                  onTap: () =>
                      setState(() => _showEvacuation = !_showEvacuation),
                ),
                const SizedBox(width: 8),

                // Shelter toggle
                _MapButton(
                  icon: Icons.shield_outlined,
                  label: _showShelters ? 'Hide Shelters' : 'Shelters',
                  active: _showShelters,
                  activeColor: const Color(0xFF2E7D32),
                  onTap: () =>
                      setState(() => _showShelters = !_showShelters),
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
  final VoidCallback onTap;

  const _MapButton({
    required this.icon,
    required this.label,
    required this.active,
    required this.activeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
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
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon,
                  size: 16,
                  color: active ? Colors.white : const Color(0xFF374151)),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: active ? Colors.white : const Color(0xFF374151),
                ),
              ),
            ],
          ),
        ),
      );
}