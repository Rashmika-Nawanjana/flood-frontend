import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api.dart';

class HomeScreen extends StatefulWidget {
  final String locationIdentifier;

  const HomeScreen({super.key, required this.locationIdentifier});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String currentCity = "Loading...";
  String riskLevel = "FETCHING";
  Color riskColor = Colors.grey;

  String? zoneId;
  bool isLoading = true;

  List alerts = [];

  @override
  void initState() {
    super.initState();
    init();
  }

  Future<void> init() async {
    setState(() => isLoading = true);
    await _fetchData();
    if (mounted) setState(() => isLoading = false);
  }

  // ─────────────────────────────
  // LAST SEEN STORAGE
  // ─────────────────────────────

  Future<void> _saveLastSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      'last_seen_alert',
      DateTime.now().toIso8601String(),
    );
  }

  Future<DateTime?> _getLastSeen() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getString('last_seen_alert');
    if (value == null) return null;
    return DateTime.parse(value);
  }

  // ─────────────────────────────
  // ALERT SUMMARY LOGIC
  // ─────────────────────────────

  Map<String, int> _buildAlertSummary(List alerts, DateTime? lastSeen) {
    Map<String, int> summary = {};

    for (var alert in alerts) {
      final type = alert['type'] ?? "UNKNOWN";
      final time = DateTime.parse(alert['triggered_at']);

      if (lastSeen == null || time.isAfter(lastSeen)) {
        summary[type] = (summary[type] ?? 0) + 1;
      }
    }

    return summary;
  }

  // ─────────────────────────────
  // LAST 3 DAYS SEVERITY LOGIC
  // ─────────────────────────────
List<Map<String, dynamic>> _get3DayFloodSeverity() {
  // 1. Get today's date at midnight
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);

  List<Map<String, dynamic>> days = [
    {"label": "Today", "level": 0},
    {"label": "Yesterday", "level": 0},
    {"label": "2 days ago", "level": 0},
  ];

  for (var alert in alerts) {
    final alertTime = DateTime.parse(alert['triggered_at']).toLocal();
    // 2. Get the alert's date at midnight
    final alertDate = DateTime(alertTime.year, alertTime.month, alertTime.day);
    
    // 3. Calculate the difference in calendar days
    final diff = today.difference(alertDate).inDays;

    if (diff >= 0 && diff < 3) {
      final severity = (alert['severity'] ?? "").toUpperCase();

      int level = 0;
      if (severity == "CRITICAL") level = 4;
      else if (severity == "HIGH") level = 3;
      else if (severity == "MEDIUM") level = 2;
      else if (severity == "LOW") level = 1;

      // This logic ensures if a day has multiple alerts, 
      // only the highest severity is recorded.
      if (level > days[diff]["level"]) {
        days[diff]["level"] = level;
      }
    }
  }

  return days;
}
Future<void> _handleLocationPermission() async {

  LocationPermission permission;

  permission = await Geolocator.checkPermission();

  if (permission == LocationPermission.denied) {

    permission = await Geolocator.requestPermission();
  }

  if (permission == LocationPermission.deniedForever) {

    throw Exception(
      "Location permissions are permanently denied.",
    );
  }
}

  // ─────────────────────────────
  // FETCH DATA
  // ─────────────────────────────

  Future<void> _fetchData() async {
    try {
      // 1. LOCATION RESOLVE
      if (widget.locationIdentifier == "USE_GPS_LOCATION") {
        await _handleLocationPermission();
        Position pos = await Geolocator.getCurrentPosition();

        final zone =
            await ApiService.resolveZone(pos.latitude, pos.longitude);

        if (zone != null) {
          zoneId = zone['zone_id'];
          currentCity = zone['zone_name'] ?? "Unknown Zone";
          riskLevel = zone['risk_level'] ?? "UNKNOWN";
          riskColor = Color(
            int.parse(
              (zone['color_code'] ?? "#808080").replaceAll('#', '0xFF'),
            ),
          );
        }
      } else {
        zoneId = widget.locationIdentifier;

        final zone = await ApiService.getZone(zoneId!);

        if (zone != null) {
          currentCity = zone['zone_name'] ?? "Manual Zone";
          riskLevel = zone['risk_level'] ?? "UNKNOWN";
          riskColor = Color(
            int.parse(
              (zone['color_code'] ?? "#808080").replaceAll('#', '0xFF'),
            ),
          );
        }
      }

      // 2. FETCH ALERTS
      if (zoneId != null) {
        final allAlerts = await ApiService.getAlerts(
          zoneId: zoneId!,
        );

        allAlerts.sort((a, b) => DateTime.parse(b['triggered_at'])
            .compareTo(DateTime.parse(a['triggered_at'])));

        alerts = allAlerts;

        await _saveLastSeen();
      }
    } catch (e) {
      debugPrint("Data Fetch Error: $e");
    }
  }

  // ─────────────────────────────
  // UI
  // ─────────────────────────────

  @override
  Widget build(BuildContext context) {
    const Color primaryBlue = Color(0xFF1565C0);

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text(
          "FloodSense",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: primaryBlue,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: init)
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: ListView(
                children: [
                  _buildRiskBanner(),
                  _buildAlertSummarySection(),
                  _build3DayFloodSummary(), // ✅ NEW FEATURE
                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }

  // ─────────────────────────────
  // RISK BANNER
  // ─────────────────────────────

  Widget _buildRiskBanner() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: riskColor,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(24, 10, 24, 40),
      child: Column(
        children: [
          Text(
            currentCity.toUpperCase(),
            style: const TextStyle(
              color: Colors.white70,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            riskLevel,
            style: const TextStyle(color: Colors.white, fontSize: 36),
          ),
          const Text(
            "CURRENT RISK LEVEL",
            style: TextStyle(color: Colors.white60, fontSize: 12),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────
  // ALERT SUMMARY
  // ─────────────────────────────

  Widget _buildAlertSummarySection() {
    return FutureBuilder<DateTime?>(
      future: _getLastSeen(),
      builder: (context, snapshot) {
        final lastSeen = snapshot.data;
        final summary = _buildAlertSummary(alerts, lastSeen);

        return Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.orange.shade50,
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: Colors.orange.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "New Alerts Summary",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 10),
              if (summary.isEmpty)
                const Text("No new alerts since last check.")
              else
                ...summary.entries.map(
                  (e) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Text("• ${e.key}: ${e.value} new alerts"),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  // ─────────────────────────────
  // 3 DAY FLOOD SEVERITY
  // ─────────────────────────────

  Widget _build3DayFloodSummary() {
    final data = _get3DayFloodSeverity();

    Color getColor(int level) {
      if (level == 4) return Colors.red;
      if (level == 3) return Colors.orange;
      if (level == 2) return Colors.amber;
      if (level == 1) return Colors.green;
      return Colors.grey;
    }

    String getText(int level) {
      if (level == 4) return "CRITICAL FLOOD";
      if (level == 3) return "HIGH RISK";
      if (level == 2) return "MODERATE";
      if (level == 1) return "LOW";
      return "NO DATA";
    }

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Flood Severity (Last 3 Days)",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 10),

          ...data.map((d) {
            return Container(
              margin: const EdgeInsets.symmetric(vertical: 6),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: getColor(d["level"]).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: getColor(d["level"])),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(d["label"]),
                  Text(
                    getText(d["level"]),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: getColor(d["level"]),
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
}
