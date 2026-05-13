import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';

import '../services/api.dart';

/// Intermediate widget displayed after successful Clerk authentication.
/// Fetches the user's role from the backend and routes accordingly:
///   • citizen        → /onboarding (splash)
///   • admin / field_officer → /access-restricted
///
/// If the backend is unreachable the user is let through (assumes citizen).
class RoleGate extends StatefulWidget {
  const RoleGate({super.key});

  @override
  State<RoleGate> createState() => _RoleGateState();
}

class _RoleGateState extends State<RoleGate>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    WidgetsBinding.instance.addPostFrameCallback((_) => _checkRole());
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  Future<void> _checkRole() async {
    try {
      // ── 1. Grab Clerk session token ────────────────────────
      final clerkAuth = ClerkAuth.of(context, listen: false);

      // Fetch token with 'flood-app' template to include custom metadata (roles)
      final jwtToken = await clerkAuth.sessionToken(templateName: 'flood-app');
      final jwt = jwtToken.jwt;

      if (jwt.isNotEmpty) {
        AuthStore.setToken(jwt);
      } else {
        debugPrint('[RoleGate] Warning: Could not extract JWT token with template "flood-app"');
      }


      // ── 2. Extract Role from Clerk User Metadata ───────────
      final user = clerkAuth.client.user;
      final metadata = user?.publicMetadata ?? {};
      final role = metadata['role'] as String? ?? 'citizen';

      if (mounted) {
        if (role == 'admin' || role == 'field_officer') {
          Navigator.of(context).pushReplacementNamed('/access-restricted');
        } else {
          // Citizen or fallback → continue to app
          Navigator.of(context).pushReplacementNamed('/onboarding');
        }
      }
    } catch (e, st) {
      debugPrint('[RoleGate] Error checking role: $e\n$st');
      // Fallback: let user through
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/onboarding');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1B2A),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedBuilder(
              animation: _pulseCtrl,
              builder: (_, __) => Transform.scale(
                scale: 0.92 + 0.08 * _pulseCtrl.value,
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF1565C0).withValues(alpha: 0.15),
                  ),
                  child: const Icon(
                    Icons.tsunami,
                    size: 56,
                    color: Color(0xFF42A5F5),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 28),
            const Text(
              'FloodSense LK',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Verifying access…',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 32),
            const SizedBox(
              width: 26,
              height: 26,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation(Color(0xFF42A5F5)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
