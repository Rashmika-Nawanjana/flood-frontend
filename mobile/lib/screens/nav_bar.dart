import 'dart:async';
import 'package:flutter/material.dart';

import '../services/socket_service.dart';
import 'home.dart';
import 'alert_page.dart';
import 'map_page.dart';
import 'settings_page.dart';

class MainNavigationWrapper extends StatefulWidget {
  final String locationIdentifier;

  const MainNavigationWrapper({super.key, required this.locationIdentifier});

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  static const Color _primaryBlue = Color(0xFF1565C0);

  int _selectedIndex = 0;
  int _unreadAlerts = 0;

  late StreamSubscription<dynamic> _alertSub;

  @override
  void initState() {
    super.initState();
    // Connect socket for this zone (USE_GPS_LOCATION resolved upstream)
    SocketService.instance.connect(widget.locationIdentifier);

    // Badge counter for Alerts tab
    _alertSub = SocketService.instance.alertStream.listen((_) {
      if (_selectedIndex != 1) {
        // not on alerts tab
        if (mounted) setState(() => _unreadAlerts++);
      }
    });
  }

  @override
  void didUpdateWidget(covariant MainNavigationWrapper old) {
    super.didUpdateWidget(old);
    if (old.locationIdentifier != widget.locationIdentifier) {
      SocketService.instance.switchZone(widget.locationIdentifier);
    }
  }

  @override
  void dispose() {
    _alertSub.cancel();
    super.dispose();
  }

  List<Widget> _pages() => [
        HomeScreen(locationIdentifier: widget.locationIdentifier),
        AlertsPage(zoneId: widget.locationIdentifier),
        MapPage(zoneId: widget.locationIdentifier),
        const SettingsPage(),
      ];

  void _onTap(int index) {
    setState(() {
      _selectedIndex = index;
      if (index == 1) _unreadAlerts = 0; // clear badge on alerts tab
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages(),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: Colors.grey.shade200, width: 1),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 12,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: _onTap,
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          elevation: 0,
          selectedItemColor: _primaryBlue,
          unselectedItemColor: Colors.grey.shade500,
          selectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.w600, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          items: [
            const BottomNavigationBarItem(
              icon: Icon(Icons.grid_view_rounded),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.warning_amber_rounded),
                  if (_unreadAlerts > 0)
                    Positioned(
                      right: -6,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: Color(0xFFC62828),
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                            minWidth: 16, minHeight: 16),
                        child: Text(
                          _unreadAlerts > 9 ? '9+' : '$_unreadAlerts',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
              label: 'Alerts',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.map_outlined),
              label: 'Map',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.settings_outlined),
              label: 'Settings',
            ),
          ],
        ),
      ),
    );
  }
}