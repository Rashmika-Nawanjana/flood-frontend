import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'api.dart';

/// Represents a real-time alert pushed via Socket.IO
class LiveAlert {
  final String id;
  final String zoneId;
  final String zoneName;
  final String title;
  final String message;
  final String severity;
  final String action;
  final DateTime triggeredAt;

  const LiveAlert({
    required this.id,
    required this.zoneId,
    required this.zoneName,
    required this.title,
    required this.message,
    required this.severity,
    required this.action,
    required this.triggeredAt,
  });

  factory LiveAlert.fromJson(Map<String, dynamic> json) => LiveAlert(
        id: json['alert_id'] ?? json['id'] ?? '',
        zoneId: json['zone_id'] ?? '',
        zoneName: json['zone_name'] ?? '',
        title: json['title'] ?? 'New Alert',
        message: json['message'] ?? '',
        severity: (json['severity'] ?? 'LOW').toUpperCase(),
        action: json['recommended_action'] ?? '',
        triggeredAt: DateTime.tryParse(json['triggered_at'] ?? '') ??
            DateTime.now(),
      );

  bool get isCritical => severity == 'CRITICAL';
  bool get isHigh => severity == 'HIGH';
}

/// Singleton Socket.IO service.
///
/// Usage:
///   SocketService.instance.connect('zone_colombo');
///   SocketService.instance.alertStream.listen((alert) { ... });
class SocketService {
  SocketService._();
  static final SocketService instance = SocketService._();

  io.Socket? _socket;
  String? _currentZone;

  // ── Streams ──────────────────────────────────────────────────────────────────
  final _alertController =
      StreamController<LiveAlert>.broadcast();
  final _connectionController =
      StreamController<bool>.broadcast();
  final _errorController =
      StreamController<String>.broadcast();

  Stream<LiveAlert> get alertStream => _alertController.stream;
  Stream<bool> get connectionStream => _connectionController.stream;
  Stream<String> get errorStream => _errorController.stream;

  bool get isConnected => _socket?.connected ?? false;
  String? get currentZone => _currentZone;

  // ── Connect / Disconnect ─────────────────────────────────────────────────────

  void connect(String zoneId) {
    if (_currentZone == zoneId && isConnected) return;

    // Leave old zone room if switching
    if (_socket != null && _currentZone != null) {
      _socket!.emit('leave_zone', {'zone_id': _currentZone});
    }

    _currentZone = zoneId;

    if (_socket == null) {
      _socket = io.io(
        ApiService.baseUrl,
        io.OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .setReconnectionAttempts(10)
            .setReconnectionDelay(2000)
            .build(),
      );

      _attachListeners();
      _socket!.connect();
    } else {
      // Already connected — just join new room
      _joinZone(zoneId);
    }
  }

  void _attachListeners() {
    _socket!
      ..onConnect((_) {
        _connectionController.add(true);
        _joinZone(_currentZone!);
      })
      ..onDisconnect((_) => _connectionController.add(false))
      ..onConnectError((err) => _errorController.add(err.toString()))
      ..onError((err) => _errorController.add(err.toString()))

      // Real-time alert events
      ..on('new_alert', (data) {
        try {
          final alert = LiveAlert.fromJson(
            data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data),
          );
          _alertController.add(alert);
        } catch (e) {
          // ignore malformed payloads
        }
      })

      // Zone risk level updated
      ..on('risk_update', (data) {
        // Re-emitted as an info alert so listeners can act
        try {
          final synth = LiveAlert.fromJson({
            'alert_id': 'risk_update_${DateTime.now().millisecondsSinceEpoch}',
            'zone_id': data['zone_id'] ?? _currentZone,
            'zone_name': data['zone_name'] ?? '',
            'title': 'Risk Level Updated',
            'message':
                'Zone risk changed to ${data['risk_level'] ?? 'UNKNOWN'}',
            'severity': data['risk_level'] ?? 'LOW',
            'recommended_action': '',
            'triggered_at': DateTime.now().toIso8601String(),
          });
          _alertController.add(synth);
        } catch (_) {}
      });
  }

  void _joinZone(String zoneId) {
    _socket?.emit('join_zone', {'zone_id': zoneId});
  }

  void switchZone(String newZoneId) {
    if (newZoneId == _currentZone) return;
    if (_socket != null && _currentZone != null) {
      _socket!.emit('leave_zone', {'zone_id': _currentZone});
    }
    _currentZone = newZoneId;
    _joinZone(newZoneId);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _currentZone = null;
  }

  void dispose() {
    disconnect();
    _alertController.close();
    _connectionController.close();
    _errorController.close();
  }
}