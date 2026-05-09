import 'dart:async';
import 'package:flutter/material.dart';

import '../services/api.dart';
import '../services/socket_service.dart';

class AlertsPage extends StatefulWidget {
  final String? zoneId;
  const AlertsPage({super.key, this.zoneId});

  @override
  State<AlertsPage> createState() => _AlertsPageState();
}

class _AlertsPageState extends State<AlertsPage> {
  static const Color _red = Color(0xFFC62828);
  static const Color _orange = Color(0xFFE65100);
  static const Color _amber = Color(0xFFF9A825);
  static const Color _blue = Color(0xFF1565C0);

  bool _isLoading = true;
  List _alerts = [];
  int _filterIndex = 0;
  final List<String> _filters = ['All', 'Critical', 'High', 'Warnings'];

  StreamSubscription<LiveAlert>? _socketSub;

  @override
  void initState() {
    super.initState();
    _fetch();
    _listenSocket();
  }

  @override
  void didUpdateWidget(covariant AlertsPage old) {
    super.didUpdateWidget(old);
    if (old.zoneId != widget.zoneId) _fetch();
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    super.dispose();
  }

  void _listenSocket() {
    _socketSub = SocketService.instance.alertStream.listen((live) {
      if (!mounted) return;
      // Only show if matches current zone
      if (live.zoneId.isNotEmpty && live.zoneId != widget.zoneId) return;
      setState(() {
        _alerts = [
          {
            'alert_id': live.id,
            'zone_id': live.zoneId,
            'zone_name': live.zoneName,
            'title': live.title,
            'message': live.message,
            'severity': live.severity,
            'recommended_action': live.action,
            'triggered_at': live.triggeredAt.toIso8601String(),
            '_is_live': true,
          },
          ..._alerts,
        ];
      });
    });
  }

  Future<void> _fetch() async {
    final zoneId = widget.zoneId;
    if (zoneId == null) {
      setState(() {
        _alerts = [];
        _isLoading = false;
      });
      return;
    }

    setState(() => _isLoading = true);

    String? severity;
    if (_filterIndex == 1) severity = 'CRITICAL';
    if (_filterIndex == 2) severity = 'HIGH';
    if (_filterIndex == 3) severity = 'MEDIUM';

    try {
      final data = await ApiService.getAlerts(
        zoneId: zoneId,
        severity: severity,
      );
      data.sort((a, b) => DateTime.parse(b['triggered_at'])
          .compareTo(DateTime.parse(a['triggered_at'])));
      if (mounted) setState(() => _alerts = data);
    } catch (e) {
      debugPrint('AlertsPage._fetch: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── Color helpers ────────────────────────────────────────────────────────────

  Color _severityColor(String? s) {
    switch ((s ?? '').toUpperCase()) {
      case 'CRITICAL':
        return _red;
      case 'HIGH':
        return _orange;
      case 'MEDIUM':
        return _amber;
      default:
        return Colors.blueGrey;
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (widget.zoneId == null) {
      return const Center(child: Text('No zone selected'));
    }

    return Column(
      children: [
        _buildHeader(),
        _buildFilterBar(),
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _alerts.isEmpty
                  ? _buildEmpty()
                  : RefreshIndicator(
                      onRefresh: _fetch,
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                        itemCount: _alerts.length,
                        itemBuilder: (_, i) => _buildCard(_alerts[i]),
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildHeader() {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 12,
        left: 20,
        right: 20,
        bottom: 8,
      ),
      child: Row(
        children: [
          const Text(
            'Alerts',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1F2937),
            ),
          ),
          const Spacer(),
          // Live indicator
          StreamBuilder<bool>(
            stream: SocketService.instance.connectionStream,
            builder: (_, snap) {
              final on = snap.data ?? SocketService.instance.isConnected;
              return Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: on
                          ? const Color(0xFF2E7D32)
                          : const Color(0xFFF9A825),
                    ),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    on ? 'Live' : 'Offline',
                    style: TextStyle(
                      fontSize: 12,
                      color: on
                          ? const Color(0xFF2E7D32)
                          : const Color(0xFFF9A825),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _fetch,
            color: Colors.grey.shade600,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.only(bottom: 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: List.generate(_filters.length, (i) {
            final selected = i == _filterIndex;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () {
                  setState(() => _filterIndex = i);
                  _fetch();
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 18, vertical: 8),
                  decoration: BoxDecoration(
                    color: selected ? _blue : const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _filters[i],
                    style: TextStyle(
                      color: selected ? Colors.white : const Color(0xFF374151),
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildCard(Map alert) {
    final color = _severityColor(alert['severity']);
    final isLive = alert['_is_live'] == true;
    final shelters = alert['recommended_shelters'] as List?;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: isLive
            ? Border.all(color: _red.withOpacity(0.4), width: 1.5)
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          leading: CircleAvatar(
            backgroundColor: color.withOpacity(0.12),
            radius: 20,
            child: Icon(Icons.warning_rounded, color: color, size: 20),
          ),
          title: Row(
            children: [
              Expanded(
                child: Text(
                  alert['title'] ?? '',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
              if (isLive)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: _red,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'LIVE',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
            ],
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 3),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    alert['severity'] ?? '',
                    style: TextStyle(
                      color: color,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _timeAgo(alert['triggered_at']),
                  style: const TextStyle(
                      fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
          ),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          children: [
            const Divider(),
            const SizedBox(height: 4),
            Text(
              alert['message'] ?? '',
              style: const TextStyle(
                  fontSize: 13, height: 1.5, color: Color(0xFF374151)),
            ),
            const SizedBox(height: 12),
            if ((alert['recommended_action'] ?? '').isNotEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _red.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: _red.withOpacity(0.2)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.directions_run,
                        color: _red, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        alert['recommended_action'],
                        style: const TextStyle(
                          color: _red,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            if (shelters != null && shelters.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text(
                'Recommended Shelter',
                style: TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 13),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined,
                      size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(shelters[0]['name'] ?? '',
                      style: const TextStyle(fontSize: 13)),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.map_outlined, size: 16),
                  label: const Text('View on Map'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.check_circle_outline,
              size: 52, color: Colors.grey.shade300),
          const SizedBox(height: 12),
          Text(
            'No active alerts',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade500,
            ),
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }

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