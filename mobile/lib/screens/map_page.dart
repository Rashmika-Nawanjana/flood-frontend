import 'package:flutter/material.dart';

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  static const Color dangerRed = Color(0xFFC62828);
  static const Color primaryBlue = Color(0xFF1565C0);

  bool _showEvacuationRoutes = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [

          Container(
            color: Colors.grey[300],
            child: const Center(
              child: Text(
                "Map Placeholder",
                style: TextStyle(fontSize: 18),
              ),
            ),
          ),

          //  3. Evacuation Toggle Button (YOUR CODE FIXED)
          Positioned(
            top: 40, // avoid status bar overlap
            right: 20,
            child: FloatingActionButton.extended(
              onPressed: () {
                setState(() {
                  _showEvacuationRoutes = !_showEvacuationRoutes;
                });
              },
              backgroundColor:
                  _showEvacuationRoutes ? dangerRed : Colors.white,
              foregroundColor:
                  _showEvacuationRoutes ? Colors.white : primaryBlue,
              icon: Icon(
                _showEvacuationRoutes
                    ? Icons.location_on
                    : Icons.directions_run,
              ),
              label: Text(
                _showEvacuationRoutes
                    ? "Hide Safe Zones"
                    : "Show Evacuation",
              ),
            ),
          ),
        ],
      ),
    );
  }
}