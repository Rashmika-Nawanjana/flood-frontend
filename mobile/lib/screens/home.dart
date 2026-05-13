import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api.dart';
import '../services/socket_service.dart';

class HomeScreen extends StatefulWidget {
  final String locationIdentifier;

  const HomeScreen({super.key, required this.locationIdentifier});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const Color _blue = Color(0xFF1565C0);

  // Zone data
  String _city = 'Loading…';
  String _riskLevel = '…';
  Color _riskColor = Colors.grey;
  String? _zoneId;

  // Alerts (FIXED TYPE)
  List<Map<String, dynamic>> _alerts = [];

  bool _isLoading = true;

  // Socket / live banner
  LiveAlert? _latestLiveAlert;
  StreamSubscription<LiveAlert>? _alertSub;
  Timer? _bannerTimer;

  @override
  void initState() {
    super.initState();
    _init();
    _listenSocket();
  }

  @override
  void didUpdateWidget(covariant HomeScreen old) {
    super.didUpdateWidget(old);
    if (old.locationIdentifier != widget.locationIdentifier) {
      _init();
    }
  }

  @override
  void dispose() {
    _alertSub?.cancel();
    _bannerTimer?.cancel();
    super.dispose();
  }

  // ── SOCKET ─────────────────────────────────────────────

  void _listenSocket() {
    _alertSub = SocketService.instance.alertStream.listen((alert) {
      if (!mounted) return;

      setState(() {
        _latestLiveAlert = alert;

        _alerts = [
          {
            'alert_id': alert.id,
            'zone_id': alert.zoneId,
            'zone_name': alert.zoneName,
            'title': alert.title,
            'message': alert.message,
            'severity': alert.severity,
            'recommended_action': alert.action,
            'triggered_at': alert.triggeredAt.toIso8601String(),
          },
          ..._alerts,
        ];
      });

      _bannerTimer?.cancel();
      _bannerTimer = Timer(const Duration(seconds: 6), () {
        if (mounted) setState(() => _latestLiveAlert = null);
      });
    });
  }

  // ── INIT ─────────────────────────────────────────────

  Future<void> _init() async {
    setState(() => _isLoading = true);
    await _fetchData();
    if (mounted) setState(() => _isLoading = false);
  }

  // ── FETCH DATA (FIXED FOR BACKEND) ────────────────────

  Future<void> _fetchData() async {
    try {
      Map<String, dynamic>? zoneData;

      if (widget.locationIdentifier == 'USE_GPS_LOCATION') {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.low,
        );

        zoneData = await ApiService.resolveZone(
          pos.latitude,
          pos.longitude,
        );
      } else {
        zoneData = await ApiService.getZone(widget.locationIdentifier);
      }

      if (zoneData != null) {
        _applyZone(zoneData);
        _zoneId = zoneData['zone_id'];
      }

      if (_zoneId != null && _zoneId!.isNotEmpty) {
        final raw = await ApiService.getAlerts(zoneId: _zoneId!);

        _alerts = List<Map<String, dynamic>>.from(raw);

        _alerts.sort((a, b) {
          final t1 = DateTime.tryParse(b['triggered_at'] ?? '') ?? DateTime(1970);
          final t2 = DateTime.tryParse(a['triggered_at'] ?? '') ?? DateTime(1970);
          return t1.compareTo(t2);
        });

        await _saveLastSeen();
      }
    } catch (e) {
      debugPrint('HomeScreen._fetchData ERROR: $e');
    }
  }

  // ── APPLY ZONE (SAFE) ─────────────────────────────────

  void _applyZone(Map zone) {
    _zoneId = zone['zone_id']?.toString();

    _city = zone['zone_name']?.toString() ?? 'Unknown';

    _riskLevel = zone['risk_level']?.toString() ?? 'UNKNOWN';

    final colorStr = zone['color_code']?.toString() ?? '#607D8B';

    _riskColor = Color(
      int.parse(colorStr.replaceAll('#', '0xFF')),
    );
  }

  // ── LAST SEEN ─────────────────────────────────────────

  Future<void> _saveLastSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      'last_seen_alert',
      DateTime.now().toIso8601String(),
    );
  }

  Future<DateTime?> _getLastSeen() async {
    final prefs = await SharedPreferences.getInstance();
    final v = prefs.getString('last_seen_alert');
    return v == null ? null : DateTime.tryParse(v);
  }

  // ── SUMMARY (FIXED) ───────────────────────────────────

  Map<String, int> _buildSummary(DateTime? lastSeen) {
    final map = <String, int>{};

    for (final a in _alerts) {
      final t = DateTime.tryParse(a['triggered_at'] ?? '');
      if (t == null) continue;

      if (lastSeen != null && !t.isAfter(lastSeen)) continue;

      final key = (a['severity'] ?? 'FLOOD').toString();

      map[key] = (map[key] ?? 0) + 1;
    }

    return map;
  }

  // ── SEVERITY ──────────────────────────────────────────

  int _severityLevel(String s) {
    switch (s) {
      case 'CRITICAL':
        return 4;
      case 'HIGH':
        return 3;
      case 'MEDIUM':
        return 2;
      case 'LOW':
        return 1;
      default:
        return 0;
    }
  }

  Color _lvlColor(int l) {
    if (l == 4) return const Color(0xFFC62828);
    if (l == 3) return const Color(0xFFE65100);
    if (l == 2) return const Color(0xFFF9A825);
    if (l == 1) return const Color(0xFF2E7D32);
    return Colors.grey;
  }

  String _lvlText(int l) {
    if (l == 4) return 'CRITICAL';
    if (l == 3) return 'HIGH RISK';
    if (l == 2) return 'MODERATE';
    if (l == 1) return 'LOW';
    return 'NO DATA';
  }

  // ── UI ────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              children: [
                RefreshIndicator(
                  onRefresh: _init,
                  child: CustomScrollView(
                    slivers: [
                      _buildSliverAppBar(),
                      SliverPadding(
                        padding: const EdgeInsets.all(16),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
                            _buildLiveConnectionChip(),
                            const SizedBox(height: 14),
                            _buildAlertSummary(),
                            const SizedBox(height: 14),
                            _buildRecentAlerts(),
                            const SizedBox(height: 24),
                          ]),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  // ── APP BAR ───────────────────────────────────────────

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 180,
      pinned: true,
      backgroundColor: _riskColor,
      title: const Text('FloodSense'),
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          color: _riskColor,
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(_city.toUpperCase(),
                    style: const TextStyle(color: Colors.white70)),
                Text(_riskLevel,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── SOCKET CHIP ───────────────────────────────────────

  Widget _buildLiveConnectionChip() {
    return StreamBuilder<bool>(
      stream: SocketService.instance.connectionStream,
      builder: (context, snap) {
        final connected =
            snap.data ?? SocketService.instance.isConnected;

        return Container(
          padding: const EdgeInsets.all(10),
          child: Text(
            connected ? 'Live Connected' : 'Connecting...',
          ),
        );
      },
    );
  }

  // ── ALERT SUMMARY ─────────────────────────────────────

  Widget _buildAlertSummary() {
    return FutureBuilder<DateTime?>(
      future: _getLastSeen(),
      builder: (context, snap) {
        final summary = _buildSummary(snap.data);

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Text(summary.toString()),
          ),
        );
      },
    );
  }

  // ── RECENT ALERTS ─────────────────────────────────────

  Widget _buildRecentAlerts() {
    final recent = _alerts.take(3).toList();

    return Column(
      children: recent
          .map((a) => ListTile(
                title: Text(a['title'] ?? ''),
                subtitle: Text(a['severity'] ?? ''),
              ))
          .toList(),
    );
  }
}