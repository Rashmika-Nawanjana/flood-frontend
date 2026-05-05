import 'package:flutter/material.dart';
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
  int _selectedIndex = 0;
  static const Color primaryBlue = Color(0xFF1565C0);

  // Function to return the list of pages
  List<Widget> _getPages() {
    return [
      HomeScreen(locationIdentifier: widget.locationIdentifier),
      AlertsPage(zoneId: widget.locationIdentifier),
      const MapPage(),
      const SettingsPage(),
    ];
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold( 
      body: IndexedStack(
        index: _selectedIndex,
        children: _getPages(),
      ),
      
      // The Bottom Navigation Bar matching your design
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: Colors.grey.shade300, width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: _onItemTapped,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: primaryBlue,
          unselectedItemColor: Colors.grey.shade600,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
          unselectedLabelStyle: const TextStyle(fontSize: 12),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.grid_view_rounded),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.warning_amber_rounded),
              label: 'Alerts',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.map_outlined),
              label: 'Map',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.settings_outlined),
              label: 'Settings',
            ),
          ],
        ),
      ),
    );
  }
}