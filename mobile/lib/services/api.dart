import 'dart:convert';
import 'package:http/http.dart' as http;
class ApiService {
  static const String devBaseUrl = 'http://localhost:8000';
  static const String stagingBaseUrl = 'https://api-stg.example.com';
  static const String prodBaseUrl = 'https://api.example.com';

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json', 
      };

  // ZONES 
  /// Fetch all monitoring zones
  static Future<List<dynamic>> getZones() async {
    try {
      final res = await http.get(Uri.parse("$devBaseUrl/api/v1/zones"), headers: _headers);

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      print("Error fetching zones: $e");
    }
    return [];
  }

  /// Get details for a specific zone
  static Future<Map<String, dynamic>?> getZone(String zoneId) async {
    try {
      final res = await http.get(Uri.parse("$devBaseUrl/api/v1/zones/$zoneId"), headers: _headers);

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      print("Error fetching zone $zoneId: $e");
    }
    return null;
  }
 
  // ALERTS 
  /// Fetch alerts for a zone with optional filters
  static Future<List<dynamic>> getAlerts({
    required String zoneId,
    String? severity,
    String? status,
  }) async {
    final queryParams = {
      'zone_id': zoneId,
      if (severity != null) 'severity': severity,
      if (status != null) 'status': status,
    };

    final uri = Uri.parse("$devBaseUrl/api/v1/alerts").replace(queryParameters: queryParams);
    try {
      final res = await http.get(uri, headers: _headers);

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      print("Error fetching alerts: $e");
    }
    return [];
  }
 
  // REVERSE GEOCODING (Location to Zone) 
  static Future<Map<String, dynamic>?> resolveZone(double lat, double lng) async {
    final uri = Uri.parse("$devBaseUrl/api/v1/resolve-zone").replace(
      queryParameters: {
        'lat': lat.toString(),
        'lng': lng.toString(),
      },
    );
    try {
      final res = await http.get(uri, headers: _headers);
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      print("Error resolving zone: $e");
    }
    return null;
  }
}
