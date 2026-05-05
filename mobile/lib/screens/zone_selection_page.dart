import 'package:flutter/material.dart';
import 'nav_bar.dart';
import '../services/api.dart';
class ZoneSelectionPage extends StatefulWidget {
  const ZoneSelectionPage({super.key});

  @override
  State<ZoneSelectionPage> createState() => _ZoneSelectionPageState();
}

class _ZoneSelectionPageState extends State<ZoneSelectionPage> {
  List zones = [];

  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadZones();
  }

  Future<void> loadZones() async {
    final data = await ApiService.getZones();

    setState(() {
      zones = data;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Select Zone")),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: zones.length,
              itemBuilder: (context, index) {
                final zone = zones[index];

                return ListTile(
                  title: Text(zone['zone_name'] ?? 'Unknown'),
                  subtitle: Text(zone['zone_id'] ?? ''),
                  onTap: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (_) => MainNavigationWrapper(
                            locationIdentifier: zone['zone_id']),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}
