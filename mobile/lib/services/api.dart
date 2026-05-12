import 'dart:convert';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:http/http.dart' as http;

class AuthStore {
  static String? token;

  static void setToken(String? newToken) {
    token = newToken;
  }

  static String? getToken() => token;
}

class ApiService {
  // ── Environment config ──────────────────────────────────────────────────────
  static const String _dev = 'http://10.0.2.2:8000';
  static const String _stg = 'https://stg.floodsense.lk';
  static const String _prod = 'https://api.example.com';


  /// Change this to switch environments
  static const String baseUrl = _stg;

  // ── Auth header ──────────────────────────────────────────────────────────────
  static Future<Map<String, String>> _headers() async {
    final token = AuthStore.getToken();
    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    };
  }

  // ── Zones ────────────────────────────────────────────────────────────────────

  /// Fetch all monitoring zones
  static Future<List<dynamic>> getZones() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/api/v1/zones'),
        headers: await _headers(),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) {
      _log('getZones', e);
    }
    return [];
  }

  /// Get details for a specific zone
  static Future<Map<String, dynamic>?> getZone(String zoneId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/api/v1/zones/$zoneId'),
        headers: await _headers(),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) {
      _log('getZone($zoneId)', e);
    }
    return null;
  }

  // ── Alerts ───────────────────────────────────────────────────────────────────

  /// Fetch alerts for a zone with optional severity / status filters
  static Future<List<dynamic>> getAlerts({
    required String zoneId,
    String? severity,
    String? status,
    int limit = 50,
  }) async {
    final params = <String, String>{
      'zone_id': zoneId,
      'limit': limit.toString(),
      if (severity != null) 'severity': severity,
      if (status != null) 'status': status,
    };

    final uri = Uri.parse('$baseUrl/api/v1/alerts')
        .replace(queryParameters: params);

    try {
      final res = await http.get(uri, headers: await _headers());
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) {
      _log('getAlerts', e);
    }
    return [];
  }

  // ── Geocoding ────────────────────────────────────────────────────────────────

  /// Resolve (lat, lng) → zone
  static Future<Map<String, dynamic>?> resolveZone(
      double lat, double lng) async {
    final uri = Uri.parse('$baseUrl/api/v1/resolve-zone').replace(
      queryParameters: {'lat': lat.toString(), 'lng': lng.toString()},
    );
    try {
      final res = await http.get(uri, headers: await _headers());
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) {
      _log('resolveZone', e);
    }
    return null;
  }

  // ── Shelters ─────────────────────────────────────────────────────────────────

  /// Fetch evacuation shelters for a zone
  static Future<List<dynamic>> getShelters(String zoneId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/api/v1/zones/$zoneId/shelters'),
        headers: await _headers(),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) {
      _log('getShelters', e);
    }
    return [];
  }

  // ── Auth / Me ────────────────────────────────────────────────────────────────

  /// Fetch the authenticated user's profile (includes roles).
  static Future<Map<String, dynamic>?> getMe() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/api/auth/me'),
        headers: await _headers(),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) {
      _log('getMe', e);
    }
    return null;
  }

  // ── Utilities ─────────────────────────────────────────────────────────────────
  static void _log(String method, Object e) =>
      // ignore: avoid_print
      print('[ApiService.$method] $e');
}