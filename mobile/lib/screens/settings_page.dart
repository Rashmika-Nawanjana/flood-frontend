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
  bool _notificationsEnabled = true;
  bool _gpsEnabled = true;

  @override
  void initState() {
    super.initState();
    _syncGpsState();
  }

  /// ✅ Single source of truth from storage
  Future<void> _syncGpsState() async {
    final prefs = await SharedPreferences.getInstance();
    final savedLocation = prefs.getString('savedLocation');

    if (!mounted) return;

    setState(() {
      _gpsEnabled = savedLocation == "USE_GPS_LOCATION";
    });
  }

  /// =========================
  /// GPS TOGGLE HANDLER
  /// =========================
  Future<void> _handleGpsToggle(bool value) async {
    final prefs = await SharedPreferences.getInstance();

    if (value) {
      // TURN ON GPS
      LocationPermission permission = await Geolocator.checkPermission();

      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        setState(() => _gpsEnabled = false);

        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Location permission denied")),
        );
        return;
      }

      await prefs.setString('savedLocation', "USE_GPS_LOCATION");

      if (!mounted) return;

      setState(() {
        _gpsEnabled = true;
      });
    } else {
      // TURN OFF GPS
      await prefs.remove('savedLocation');

      if (!mounted) return;

      setState(() {
        _gpsEnabled =true;
      });

      // Go back to manual zone selection
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const ZoneSelectionPage(),
        ),
      );

      // 🔁 refresh after coming back
      await _syncGpsState();
    }
  }

  /// =========================
  /// BUILD UI
  /// =========================
  @override
  Widget build(BuildContext context) {
    const Color primaryBlue = Color(0xFF1565C0);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSectionHeader("Zone Settings"),

        /// Manual Zone
        ListTile(
          leading: const Icon(Icons.edit_outlined, color: primaryBlue),
          title: const Text("Change Manual Zone"),
          subtitle: const Text("Select a different city to monitor"),
          trailing: const Icon(Icons.chevron_right),
          onTap: () async {
            final selectedZone = await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ZoneSelectionPage(),
              ),
            );

            if (selectedZone != null && mounted) {
              Navigator.pop(context, selectedZone);
            }
          },
        ),

        /// GPS Toggle
        SwitchListTile(
          secondary: const Icon(Icons.gps_fixed, color: primaryBlue),
          title: const Text("Use Live GPS"),
          subtitle: const Text(
              "Automatically track risk based on your movement"),
          value: _gpsEnabled,
          activeColor: primaryBlue,
          onChanged: _handleGpsToggle,
        ),

        const SizedBox(height: 20),

        _buildSectionHeader("Alerts"),

        SwitchListTile(
          secondary: const Icon(Icons.notifications_active_outlined,
              color: primaryBlue),
          title: const Text("Push Notifications"),
          subtitle:
              const Text("Receive real-time alerts for flood risks"),
          value: _notificationsEnabled,
          activeColor: primaryBlue,
          onChanged: (value) {
            setState(() {
              _notificationsEnabled = value;
            });
          },
        ),

        const SizedBox(height: 20),

        _buildSectionHeader("Information"),

        ListTile(
          leading: const Icon(Icons.info_outline, color: primaryBlue),
          title: const Text("About FloodSense LK"),
          subtitle: const Text("Smart Flood Management System v1.0"),
        ),

        ListTile(
          leading: const Icon(Icons.verified_user_outlined,
              color: primaryBlue),
          title: const Text("Emergency Protocol"),
          subtitle:
              const Text("How to use this app during a disaster"),
          onTap: () {},
        ),
      ],
    );
  }

  /// =========================
  /// HEADER WIDGET
  /// =========================
  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, bottom: 8, top: 10),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          color: Color(0xFF6B7280),
          fontWeight: FontWeight.bold,
          fontSize: 12,
          letterSpacing: 1.1,
        ),
      ),
    );
  }
}