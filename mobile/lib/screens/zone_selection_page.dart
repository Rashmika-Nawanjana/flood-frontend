import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api.dart';
import 'nav_bar.dart';

class ZoneSelectionPage extends StatefulWidget {
  const ZoneSelectionPage({super.key});

  @override
  State<ZoneSelectionPage> createState() => _ZoneSelectionPageState();
}

class _ZoneSelectionPageState extends State<ZoneSelectionPage> {
  static const _blue = Color(0xFF1565C0);

  List _zones = [];
  List _filtered = [];
  bool _isLoading = true;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    final data = await ApiService.getZones();
    if (mounted) {
      setState(() {
        _zones = data;
        _filtered = data;
        _isLoading = false;
      });
    }
  }

  void _search(String q) {
    setState(() {
      _query = q;
      _filtered = _zones.where((z) {
        final name = (z['zone_name'] ?? '').toString().toLowerCase();
        final id = (z['zone_id'] ?? '').toString().toLowerCase();
        return name.contains(q.toLowerCase()) ||
            id.contains(q.toLowerCase());
      }).toList();
    });
  }

  Future<void> _select(Map zone) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('savedLocation', zone['zone_id']);

    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => MainNavigationWrapper(
          locationIdentifier: zone['zone_id'],
        ),
      ),
    );
  }

  // ── Risk color helper ────────────────────────────────────────────────────────
  Color _riskColor(String? level) {
    switch ((level ?? '').toUpperCase()) {
      case 'CRITICAL':
        return const Color(0xFFC62828);
      case 'HIGH':
        return const Color(0xFFE65100);
      case 'MEDIUM':
        return const Color(0xFFF9A825);
      case 'LOW':
        return const Color(0xFF2E7D32);
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        title: const Text('Select Zone'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
      ),
      body: Column(
        children: [
          // ── Search bar ───────────────────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: TextField(
              onChanged: _search,
              decoration: InputDecoration(
                hintText: 'Search zone or city…',
                hintStyle:
                    TextStyle(color: Colors.grey.shade400, fontSize: 14),
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFFF3F4F6),
                contentPadding: EdgeInsets.zero,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // ── List ──────────────────────────────────────────────────────
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filtered.isEmpty
                    ? Center(
                        child: Text('No zones found',
                            style: TextStyle(color: Colors.grey.shade500)),
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filtered.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, i) {
                            final zone = _filtered[i];
                            final risk = zone['risk_level'] as String?;

                            return GestureDetector(
                              onTap: () => _select(zone),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          Colors.black.withOpacity(0.04),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    // Risk indicator dot
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: _riskColor(risk),
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            zone['zone_name'] ?? 'Unknown',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w600,
                                              fontSize: 15,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            zone['zone_id'] ?? '',
                                            style: TextStyle(
                                              color: Colors.grey.shade500,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (risk != null)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color:
                                              _riskColor(risk).withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(20),
                                        ),
                                        child: Text(
                                          risk,
                                          style: TextStyle(
                                            color: _riskColor(risk),
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                    const SizedBox(width: 8),
                                    Icon(Icons.chevron_right,
                                        color: Colors.grey.shade400, size: 20),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}