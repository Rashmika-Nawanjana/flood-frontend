import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'zone_selection_page.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  static const Color _blue = Color(0xFF1565C0);

  bool _gpsEnabled = false;
  bool _notificationsEnabled = true;
  String? _savedZoneId;

  @override
  void initState() {
    super.initState();
    _sync();
  }

  Future<void> _sync() async {
    final prefs = await SharedPreferences.getInstance();
    final loc = prefs.getString('savedLocation');
    if (mounted) {
      setState(() {
        _gpsEnabled = loc == 'USE_GPS_LOCATION';
        _savedZoneId =
            (loc != null && loc != 'USE_GPS_LOCATION') ? loc : null;
      });
    }
  }

  Future<void> _handleGpsToggle(bool val) async {
    final prefs = await SharedPreferences.getInstance();

    if (val) {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permission denied')),
          );
        }
        return;
      }
      await prefs.setString('savedLocation', 'USE_GPS_LOCATION');
      if (mounted) setState(() => _gpsEnabled = true);
    } else {
      await prefs.remove('savedLocation');
      if (mounted) setState(() => _gpsEnabled = false);

      await Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const ZoneSelectionPage()),
      );
      await _sync();
    }
  }

  Future<void> _changeZone() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const ZoneSelectionPage()),
    );
    await _sync();
  }

  Future<void> _signOut() async {
    final authState = ClerkAuth.of(context, listen: false);
    await authState.signOut();
    if (!mounted) return;
    Navigator.of(context).pushNamedAndRemoveUntil('/sign-in', (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: Colors.white,
            foregroundColor: const Color(0xFF1F2937),
            elevation: 0,
            pinned: true,
            title: const Text('Settings'),
            automaticallyImplyLeading: false,
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildSection(
                    'Location',
                    [
                      _buildSwitchTile(
                        icon: Icons.gps_fixed,
                        title: 'Use Live GPS',
                        subtitle: 'Automatically track risk by movement',
                        value: _gpsEnabled,
                        onChanged: _handleGpsToggle,
                      ),
                      if (!_gpsEnabled)
                        _buildTappableTile(
                          icon: Icons.edit_location_alt_outlined,
                          title: 'Change Manual Zone',
                          subtitle: _savedZoneId != null
                              ? 'Current: $_savedZoneId'
                              : 'No zone selected',
                          onTap: _changeZone,
                        ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _buildSection(
                    'Notifications',
                    [
                      _buildSwitchTile(
                        icon: Icons.notifications_active_outlined,
                        title: 'Push Notifications',
                        subtitle: 'Real-time alerts for flood risks',
                        value: _notificationsEnabled,
                        onChanged: (v) =>
                            setState(() => _notificationsEnabled = v),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _buildSection(
                    'About',
                    [
                      _buildInfoTile(
                        icon: Icons.info_outline,
                        title: 'FloodSense LK',
                        subtitle: 'Smart Flood Management System v2.0',
                      ),
                      _buildTappableTile(
                        icon: Icons.verified_user_outlined,
                        title: 'Emergency Protocol',
                        subtitle: 'How to use this app during a disaster',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _buildSection(
                    'Account',
                    [
                      _buildTappableTile(
                        icon: Icons.logout,
                        title: 'Sign Out',
                        subtitle: 'Log out of your account',
                        onTap: _signOut,
                        destructive: true,
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Section + tiles ──────────────────────────────────────────────────────────

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(
              color: Color(0xFF6B7280),
              fontWeight: FontWeight.w700,
              fontSize: 11,
              letterSpacing: 1.2,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
              ),
            ],
          ),
          child: Column(
            children: children
                .asMap()
                .entries
                .map((e) {
                  final last = e.key == children.length - 1;
                  return Column(
                    children: [
                      e.value,
                      if (!last)
                        Divider(
                          height: 1,
                          indent: 56,
                          color: Colors.grey.shade100,
                        ),
                    ],
                  );
                })
                .toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      secondary: _iconBox(icon),
      title: Text(title,
          style: const TextStyle(
              fontWeight: FontWeight.w500, fontSize: 14)),
      subtitle: Text(subtitle,
          style: const TextStyle(fontSize: 12, color: Colors.grey)),
      value: value,
      activeColor: _blue,
      onChanged: onChanged,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  Widget _buildTappableTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool destructive = false,
  }) {
    final color = destructive ? const Color(0xFFC62828) : _blue;
    return ListTile(
      leading: _iconBox(icon, color: color),
      title: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.w500,
          fontSize: 14,
          color: destructive ? const Color(0xFFC62828) : null,
        ),
      ),
      subtitle: Text(subtitle,
          style: const TextStyle(fontSize: 12, color: Colors.grey)),
      trailing: const Icon(Icons.chevron_right, size: 18, color: Colors.grey),
      onTap: onTap,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  Widget _buildInfoTile({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return ListTile(
      leading: _iconBox(icon),
      title: Text(title,
          style: const TextStyle(
              fontWeight: FontWeight.w500, fontSize: 14)),
      subtitle: Text(subtitle,
          style: const TextStyle(fontSize: 12, color: Colors.grey)),
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  Widget _iconBox(IconData icon, {Color? color}) => Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: (color ?? _blue).withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color ?? _blue, size: 18),
      );
}