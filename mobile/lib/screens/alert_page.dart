import 'package:flutter/material.dart';
import '../services/api.dart';

class AlertsPage extends StatefulWidget {
  final String? zoneId;

  const AlertsPage({super.key, this.zoneId});

  @override
  State<AlertsPage> createState() => _AlertsPageState();
}

class _AlertsPageState extends State<AlertsPage> {
  static const Color dangerRed = Color(0xFFC62828);
  static const Color warningOrange = Color(0xFFF9A825);
  static const Color primaryBlue = Color(0xFF1565C0);

  bool _isLoading = true;
  List<Map<String, dynamic>> _alerts = [];

  int _filterIndex = 0;
  final List<String> _filters = ["All", "Critical", "High", "Warnings"];

  @override
  void initState() {
    super.initState();
    _fetchAlerts();
  }

  @override
  void didUpdateWidget(covariant AlertsPage oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.zoneId != widget.zoneId) {
      _fetchAlerts();
    }
  }

  // ─────────────────────────────
  // FETCH ALERTS (API)
  // ─────────────────────────────
  Future<void> _fetchAlerts() async {
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
    if (_filterIndex == 1) severity = "CRITICAL";
    if (_filterIndex == 2) severity = "HIGH";
    if (_filterIndex == 3) severity = "MEDIUM";

    try {
      final data = await ApiService.getAlerts(
        zoneId: zoneId,
        severity: severity,
      );

      setState(() {
        _alerts = List<Map<String, dynamic>>.from(data);
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Alerts error: $e");
      setState(() => _isLoading = false);
    }
  }

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  @override
  Widget build(BuildContext context) {
    if (widget.zoneId == null) {
      return const Center(child: Text("No zone selected"));
    }

    return Container(
      color: Colors.white, // Ensure SafeArea background matches filter bar
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _buildFilterBar(),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _alerts.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: _fetchAlerts,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _alerts.length,
                            itemBuilder: (_, i) => _buildAlertCard(_alerts[i]),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────
  // FILTER BAR
  // ─────────────────────────────
  Widget _buildFilterBar() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(_filters.length, (i) {
          final selected = i == _filterIndex;

          return GestureDetector(
            onTap: () {
              setState(() => _filterIndex = i);
              _fetchAlerts();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
              decoration: BoxDecoration(
                color: selected ? primaryBlue : const Color(0xFFE5E7EB),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _filters[i],
                style: TextStyle(
                  color: selected ? Colors.white : Colors.black,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  // ─────────────────────────────
  // ALERT CARD
  // ─────────────────────────────
  Widget _buildAlertCard(Map<String, dynamic> alert) {
    final severity = (alert['severity'] ?? '').toString();
    final isCritical = severity == "CRITICAL";
    final color = isCritical ? dangerRed : warningOrange;

    final shelters = alert['recommended_shelters'] as List?;

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        leading: Icon(Icons.warning_rounded, color: color),
        title: Text(
          alert['title'] ?? '',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          "${alert['zone_name'] ?? ''} • $severity\n"
          "${_timeAgo(alert['triggered_at'])} • ${_formatTime(alert['triggered_at'])}",
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(alert['message'] ?? ''),
                const Divider(height: 24),

                Text(
                  "ACTION: ${alert['recommended_action'] ?? ''}",
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: dangerRed,
                  ),
                ),

                const SizedBox(height: 12),

                if (shelters != null && shelters.isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Recommended Shelter:",
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      Text(shelters[0]['name'] ?? ''),
                    ],
                  ),

                const SizedBox(height: 12),

                ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.directions_run),
                  label: const Text("View Shelter"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryBlue,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────
  Widget _buildEmptyState() {
    return Center(
      child: Text(
        "No active alerts for this zone.",
        style: TextStyle(color: Colors.grey[600]),
      ),
    );
  }

  // ─────────────────────────────
  // TIME HELPERS
  // ─────────────────────────────
  String _formatTime(String? iso) {
    if (iso == null) return "";
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return "";

    final hour = dt.hour > 12 ? dt.hour - 12 : dt.hour;
    final ampm = dt.hour >= 12 ? "PM" : "AM";

    return "${dt.day}/${dt.month}/${dt.year} • $hour:${dt.minute.toString().padLeft(2, '0')} $ampm";
  }

  String _timeAgo(String? iso) {
    if (iso == null) return "";
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return "";

    final diff = DateTime.now().difference(dt);

    if (diff.inMinutes < 1) return "Just now";
    if (diff.inMinutes < 60) return "${diff.inMinutes} min ago";
    if (diff.inHours < 24) return "${diff.inHours} hr ago";

    return "${diff.inDays} days ago";
  }
}