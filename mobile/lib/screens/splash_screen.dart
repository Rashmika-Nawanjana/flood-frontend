import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'zone_selection_page.dart';
import 'nav_bar.dart';
import '../services/api.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // We use addPostFrameCallback to ensure the build method finishes 
    // before we start triggering navigation logic.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _handleStartupLogic();
    });
  }

  Future<void> _handleStartupLogic() async {
    // 1. Minimum logo display time
    await Future.delayed(const Duration(seconds: 3));

    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? savedLocation = prefs.getString('savedLocation');

    // 2. Return User check
if (savedLocation != null) {
  // If it was a real zone → go home
  if (savedLocation != "USE_GPS_LOCATION") {
    _navigateToHome(savedLocation);
    return;
  }

  // If GPS flag → re-check permission
  await _requestLocationPermission();
  return;
}

    // 3. New User: Request Permission
    await _requestLocationPermission();
  }
Future<void> _requestLocationPermission() async {
  LocationPermission permission = await Geolocator.checkPermission();

  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }

  // ❌ If denied → go manual selection
  if (permission == LocationPermission.denied ||
      permission == LocationPermission.deniedForever) {
    _navigateToLocationSelect();
    return;
  }

  try {
    Position position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.low,
      timeLimit: const Duration(seconds: 5),
    );

    final zone = await ApiService.resolveZone(
      position.latitude,
      position.longitude,
    );

    if (zone == null) {
      // If no zone found → fallback
      _navigateToLocationSelect();
      return;
    }

    final zoneId = zone['zone_id'];

    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString('savedLocation', zoneId);

    _navigateToHome(zoneId);

  } catch (e) {
    _navigateToLocationSelect();
  }
}

  void _navigateToHome(String locationIdentifier) {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) =>  MainNavigationWrapper(locationIdentifier: locationIdentifier)),
    );
  }

  void _navigateToLocationSelect() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const ZoneSelectionPage()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1565C0), 
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.tsunami, size: 100, color: Colors.white),
            const SizedBox(height: 24),
            const Text(
              "FloodSense LK",
              style: TextStyle(
                color: Colors.white, 
                fontSize: 28, 
                fontWeight: FontWeight.bold, 
                letterSpacing: 1.2
              ),
            ),
            const Text(
              "Tectonic Sentinel Design",
              style: TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const SizedBox(height: 40),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              strokeWidth: 2,
            ),
          ],
        ),
      ),
    );
  }
}