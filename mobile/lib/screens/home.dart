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

  // Alerts
  List _alerts = [];
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

  // ── Socket listener ──────────────────────────────────────────────────────────

  void _listenSocket() {
    _alertSub = SocketService.instance.alertStream.listen((alert) {
      if (!mounted) return;
      setState(() {
        _latestLiveAlert = alert;
        // Also prepend to local list for display
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

      // Auto-dismiss banner after 6 s
      _bannerTimer?.cancel();
      _bannerTimer = Timer(const Duration(seconds: 6), () {
        if (mounted) setState(() => _latestLiveAlert = null);
      });
    });
  }

  // ── Data fetch ───────────────────────────────────────────────────────────────

  Future<void> _init() async {
    setState(() => _isLoading = true);
    await _fetchData();
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchData() async {
    try {
      if (widget.locationIdentifier == 'USE_GPS_LOCATION') {
        final pos = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.low);
        final zone =
            await ApiService.resolveZone(pos.latitude, pos.longitude);
        if (zone != null) _applyZone(zone);
      } else {
        _zoneId = widget.locationIdentifier;
        final zone = await ApiService.getZone(_zoneId!);
        if (zone != null) _applyZone(zone);
      }

      if (_zoneId != null) {
        final raw = await ApiService.getAlerts(zoneId: _zoneId!);
        raw.sort((a, b) =>
            DateTime.parse(b['triggered_at'])
                .compareTo(DateTime.parse(a['triggered_at'])));
        _alerts = raw;
        await _saveLastSeen();
      }
    } catch (e) {
      debugPrint('HomeScreen._fetchData: $e');
    }
  }

  void _applyZone(Map zone) {
    _zoneId = zone['zone_id'];
    _city = zone['zone_name'] ?? 'Unknown';
    _riskLevel = zone['risk_level'] ?? 'UNKNOWN';
    _riskColor = Color(
      int.parse((zone['color_code'] ?? '#607D8B').replaceAll('#', '0xFF')),
    );
  }

  Future<void> _saveLastSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('last_seen_alert', DateTime.now().toIso8601String());
  }

  Future<DateTime?> _getLastSeen() async {
    final prefs = await SharedPreferences.getInstance();
    final v = prefs.getString('last_seen_alert');
    return v == null ? null : DateTime.tryParse(v);
  }

  // ── Alert summary ────────────────────────────────────────────────────────────

  Map<String, int> _buildSummary(DateTime? lastSeen) {
    final map = <String, int>{};
    for (final a in _alerts) {
      final t = DateTime.tryParse(a['triggered_at'] ?? '');
      if (t == null) continue;
      if (lastSeen != null && !t.isAfter(lastSeen)) continue;
      final type = a['type'] ?? 'FLOOD';
      map[type] = (map[type] ?? 0) + 1;
    }
    return map;
  }

  // ── 3-day severity ───────────────────────────────────────────────────────────

  List<Map<String, dynamic>> _get3DaySeverity() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final days = [
      {'label': 'Today', 'level': 0},
      {'label': 'Yesterday', 'level': 0},
      {'label': '2 days ago', 'level': 0},
    ];

    for (final a in _alerts) {
      final dt = DateTime.tryParse(a['triggered_at'] ?? '')?.toLocal();
      if (dt == null) continue;
      final d = today.difference(DateTime(dt.year, dt.month, dt.day)).inDays;
      if (d < 0 || d >= 3) continue;
      final lvl = _severityLevel((a['severity'] ?? '').toUpperCase());
      if (lvl > (days[d]['level'] as int)) days[d]['level'] = lvl;
    }
    return days;
  }

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

  // ── UI ───────────────────────────────────────────────────────────────────────

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
                            _build3DaySeverity(),
                            const SizedBox(height: 14),
                            _buildRecentAlerts(),
                            const SizedBox(height: 24),
                          ]),
                        ),
                      ),
                    ],
                  ),
                ),

                // ── Live alert banner ──────────────────────────────────
                if (_latestLiveAlert != null)
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: _LiveAlertBanner(
                      alert: _latestLiveAlert!,
                      onDismiss: () =>
                          setState(() => _latestLiveAlert = null),
                    ),
                  ),
              ],
            ),
    );
  }

  // ── Sliver app bar (risk banner) ─────────────────────────────────────────────

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 180,
      floating: false,
      pinned: true,
      backgroundColor: _riskColor,
      automaticallyImplyLeading: false,
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh, color: Colors.white),
          onPressed: _init,
        ),
      ],
      title: Text(
        'FloodSense',
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
          fontSize: 20,
        ),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                _riskColor,
                _riskColor.withOpacity(0.82),
              ],
            ),
          ),
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 40),
                Text(
                  _city.toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    letterSpacing: 2,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _riskLevel,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 38,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Text(
                  'CURRENT RISK LEVEL',
                  style: TextStyle(
                    color: Colors.white60,
                    fontSize: 11,
                    letterSpacing: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Socket connection chip ───────────────────────────────────────────────────

  Widget _buildLiveConnectionChip() {
    return StreamBuilder<bool>(
      stream: SocketService.instance.connectionStream,
      builder: (context, snap) {
        final connected = snap.data ?? SocketService.instance.isConnected;
        return Align(
          alignment: Alignment.centerLeft,
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              color: connected
                  ? const Color(0xFFE8F5E9)
                  : const Color(0xFFFFF8E1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: connected
                    ? const Color(0xFF2E7D32).withOpacity(0.4)
                    : const Color(0xFFF9A825).withOpacity(0.5),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: connected
                        ? const Color(0xFF2E7D32)
                        : const Color(0xFFF9A825),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  connected ? 'Live — Real-time alerts active' : 'Connecting…',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: connected
                        ? const Color(0xFF2E7D32)
                        : const Color(0xFFE65100),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── Alert summary ─────────────────────────────────────────────────────────────

  Widget _buildAlertSummary() {
    return FutureBuilder<DateTime?>(
      future: _getLastSeen(),
      builder: (context, snap) {
        final summary = _buildSummary(snap.data);
        return _Card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: const [
                  Icon(Icons.notification_important_outlined,
                      color: Color(0xFFE65100), size: 18),
                  SizedBox(width: 8),
                  Text(
                    'New Alerts Since Last Visit',
                    style: TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (summary.isEmpty)
                const Text(
                  'No new alerts since your last check.',
                  style: TextStyle(color: Colors.grey, fontSize: 13),
                )
              else
                ...summary.entries.map(
                  (e) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      children: [
                        const Icon(Icons.circle,
                            size: 7, color: Color(0xFFE65100)),
                        const SizedBox(width: 8),
                        Text('${e.key}: ',
                            style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13)),
                        Text('${e.value} new',
                            style: const TextStyle(fontSize: 13)),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  // ── 3-day severity ────────────────────────────────────────────────────────────

  Widget _build3DaySeverity() {
    final data = _get3DaySeverity();
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.bar_chart_rounded, color: _blue, size: 18),
              SizedBox(width: 8),
              Text(
                'Flood Severity — Last 3 Days',
                style: TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...data.map((d) {
            final color = _lvlColor(d['level'] as int);
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
              decoration: BoxDecoration(
                color: color.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: color.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 88,
                    child: Text(
                      d['label'] as String,
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                  ),
                  Expanded(
                    child: LinearProgressIndicator(
                      value: (d['level'] as int) / 4,
                      backgroundColor: color.withOpacity(0.15),
                      valueColor: AlwaysStoppedAnimation(color),
                      minHeight: 6,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    _lvlText(d['level'] as int),
                    style: TextStyle(
                      color: color,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // ── Recent alerts ────────────────────────────────────────────────────────────

  Widget _buildRecentAlerts() {
    final recent = _alerts.take(3).toList();
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.warning_amber_rounded,
                  color: Color(0xFFC62828), size: 18),
              SizedBox(width: 8),
              Text(
                'Recent Alerts',
                style: TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (recent.isEmpty)
            const Text(
              'No recent alerts for this zone.',
              style: TextStyle(color: Colors.grey, fontSize: 13),
            )
          else
            ...recent.map((a) {
              final isCrit =
                  (a['severity'] ?? '').toUpperCase() == 'CRITICAL';
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: (isCrit
                          ? const Color(0xFFC62828)
                          : const Color(0xFFF9A825))
                      .withOpacity(0.07),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.warning_rounded,
                      size: 18,
                      color: isCrit
                          ? const Color(0xFFC62828)
                          : const Color(0xFFF9A825),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            a['title'] ?? '',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            _timeAgo(a['triggered_at']),
                            style: const TextStyle(
                                fontSize: 11, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  String _timeAgo(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    return '${diff.inDays} days ago';
  }
}

// ── Shared card widget ────────────────────────────────────────────────────────

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: child,
      );
}

// ── Live alert banner ─────────────────────────────────────────────────────────

class _LiveAlertBanner extends StatefulWidget {
  final LiveAlert alert;
  final VoidCallback onDismiss;
  const _LiveAlertBanner(
      {required this.alert, required this.onDismiss});

  @override
  State<_LiveAlertBanner> createState() => _LiveAlertBannerState();
}

class _LiveAlertBannerState extends State<_LiveAlertBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 350));
    _slide = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isCrit = widget.alert.isCritical;
    final color = isCrit ? const Color(0xFFC62828) : const Color(0xFFE65100);

    return SlideTransition(
      position: _slide,
      child: Material(
        elevation: 8,
        color: color,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                const Icon(Icons.warning_rounded,
                    color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        widget.alert.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        widget.alert.severity,
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: widget.onDismiss,
                  child: const Icon(Icons.close,
                      color: Colors.white70, size: 18),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}