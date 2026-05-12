import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api.dart';
import 'zone_selection_page.dart';
import 'nav_bar.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  bool _isChecking = true;
  String _statusText = 'Checking saved location…';
  late AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  // ── Boot logic ───────────────────────────────────────────────────────────────

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('savedLocation');

    if (saved != null) {
      if (saved == 'USE_GPS_LOCATION') {
        _setStatus('Acquiring GPS…');
        await _tryGps();
      } else {
        _navigateHome(saved);
      }
    } else {
      // First run — show the choice UI
      if (mounted) setState(() => _isChecking = false);
    }
  }

  Future<void> _tryGps() async {
    LocationPermission perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.denied ||
        perm == LocationPermission.deniedForever) {
      _navigateZoneSelect();
      return;
    }

    try {
      _setStatus('Getting your position…');
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
        timeLimit: const Duration(seconds: 6),
      );

      _setStatus('Resolving your zone…');
      final zone = await ApiService.resolveZone(pos.latitude, pos.longitude);

      if (zone == null) {
        _navigateZoneSelect();
        return;
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('savedLocation', zone['zone_id']);
      _navigateHome(zone['zone_id']);
    } catch (_) {
      _navigateZoneSelect();
    }
  }

  Future<void> _requestGpsPermission() async {
    setState(() => _isChecking = true);
    _setStatus('Requesting location access…');
    await _tryGps();
  }

  void _setStatus(String text) {
    if (mounted) setState(() => _statusText = text);
  }

  void _navigateHome(String locationId) {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(MaterialPageRoute(
      builder: (_) => MainNavigationWrapper(locationIdentifier: locationId),
    ));
  }

  void _navigateZoneSelect() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(MaterialPageRoute(
      builder: (_) => const ZoneSelectionPage(),
    ));
  }

  // ── UI ───────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1B2A),
      body: Stack(
        children: [
          // Background blobs
          Positioned(
            top: -60,
            right: -60,
            child: _blob(260, const Color(0xFF1565C0).withOpacity(0.3)),
          ),
          Positioned(
            bottom: -80,
            left: -80,
            child: _blob(300, const Color(0xFF0288D1).withOpacity(0.18)),
          ),

          SafeArea(
            child: _isChecking ? _buildChecking() : _buildChoice(),
          ),
        ],
      ),
    );
  }

  Widget _buildChecking() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedBuilder(
            animation: _pulseCtrl,
            builder: (_, __) => Transform.scale(
              scale: 0.92 + 0.08 * _pulseCtrl.value,
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF1565C0).withOpacity(0.15),
                ),
                child: const Icon(Icons.tsunami,
                    size: 64, color: Color(0xFF42A5F5)),
              ),
            ),
          ),
          const SizedBox(height: 28),
          const Text(
            'FloodSense LK',
            style: TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            _statusText,
            style: const TextStyle(color: Colors.white54, fontSize: 14),
          ),
          const SizedBox(height: 32),
          const SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              valueColor: AlwaysStoppedAnimation(Color(0xFF42A5F5)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChoice() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Icon
          Center(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1565C0).withOpacity(0.18),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.tsunami,
                  size: 56, color: Color(0xFF42A5F5)),
            ),
          ),
          const SizedBox(height: 28),

          const Center(
            child: Text(
              'FloodSense LK',
              style: TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 8),
          const Center(
            child: Text(
              'Choose how to track your flood risk',
              style: TextStyle(color: Colors.white54, fontSize: 14),
            ),
          ),

          const SizedBox(height: 48),

          // GPS card
          _ChoiceCard(
            icon: Icons.gps_fixed,
            title: 'Use Live GPS',
            subtitle: 'Auto-detect your zone using device location',
            accent: const Color(0xFF1565C0),
            onTap: _requestGpsPermission,
          ),

          const SizedBox(height: 16),

          // Manual card
          _ChoiceCard(
            icon: Icons.map_outlined,
            title: 'Select Zone Manually',
            subtitle: 'Pick a city or district from the list',
            accent: const Color(0xFF0288D1),
            onTap: _navigateZoneSelect,
          ),
        ],
      ),
    );
  }

  Widget _blob(double size, Color color) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(shape: BoxShape.circle, color: color),
      );
}

class _ChoiceCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color accent;
  final VoidCallback onTap;

  const _ChoiceCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.accent,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.07),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: accent.withOpacity(0.4)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: accent.withOpacity(0.18),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: accent, size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      )),
                  const SizedBox(height: 3),
                  Text(subtitle,
                      style: const TextStyle(
                          color: Colors.white54, fontSize: 13)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios,
                size: 16, color: Colors.white38),
          ],
        ),
      ),
    );
  }
}