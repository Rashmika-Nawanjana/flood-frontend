import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
/// The sign-in screen wraps [ClerkAuthBuilder] so that:
///   - When signed OUT  → show the branded sign-in UI + [ClerkAuthentication]
///   - When signed IN   → immediately forward to /onboarding
class SignInScreen extends StatelessWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ClerkAuthBuilder(
      // Already signed in (e.g. token still valid) → go straight to onboarding
      signedInBuilder: (context, authState) {
        // Use addPostFrameCallback so we don't navigate during build
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Navigator.pushReplacementNamed(context, '/onboarding');
        });
        return const Scaffold(
          backgroundColor: Color(0xFF0D1B2A),
          body: Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation(Color(0xFF42A5F5)),
            ),
          ),
        );
      },

      // Not signed in → show branded page with ClerkAuthentication widget
      signedOutBuilder: (context, authState) {
        return _SignInView(authState: authState);
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Branded sign-in view
// ─────────────────────────────────────────────────────────────────────────────

class _SignInView extends StatelessWidget {
  final ClerkAuthState authState;
  const _SignInView({required this.authState});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1B2A),
      body: Stack(
        children: [
          // Background blobs
          Positioned(
            top: -80,
            right: -80,
            child: _Blob(size: 300, color: const Color(0xFF1565C0).withOpacity(0.35)),
          ),
          Positioned(
            bottom: -60,
            left: -60,
            child: _Blob(size: 240, color: const Color(0xFF0288D1).withOpacity(0.2)),
          ),

          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),

                  // ── Logo ────────────────────────────────────────────────
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1565C0),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.tsunami, color: Colors.white, size: 28),
                      ),
                      const SizedBox(width: 14),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'FloodSense LK',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            'Smart Flood Management',
                            style: TextStyle(color: Colors.white54, fontSize: 12),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 44),

                  // ── Headline ────────────────────────────────────────────
                  const Text(
                    'Stay ahead\nof flood risk.',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 36,
                      fontWeight: FontWeight.w700,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Live alerts, zone-aware warnings, and\nevacuation guidance — right in your pocket.',
                    style: TextStyle(color: Colors.white60, fontSize: 15, height: 1.5),
                  ),

                  const SizedBox(height: 40),

                  // ── Feature pills ───────────────────────────────────────
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: const [
                      _FeaturePill(icon: Icons.gps_fixed, label: 'GPS tracking'),
                      _FeaturePill(icon: Icons.warning_amber_rounded, label: 'Live alerts'),
                      _FeaturePill(icon: Icons.map_outlined, label: 'Evacuation map'),
                      _FeaturePill(icon: Icons.shield_outlined, label: 'Safe shelters'),
                    ],
                  ),

                  const SizedBox(height: 44),

                  // ── Clerk authentication widget ─────────────────────────
                  // ClerkAuthentication handles sign-in AND sign-up UI.
                  // Once authenticated, ClerkAuthBuilder above switches to
                  // signedInBuilder which navigates to /onboarding.
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.18),
                          blurRadius: 30,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: const Padding(
                        padding: EdgeInsets.all(4),
                        // ClerkAuthentication is the correct widget name in
                        // clerk_flutter — it renders Clerk's full sign-in/up UI
                        child: ClerkAuthentication(),
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Blob extends StatelessWidget {
  final double size;
  final Color color;
  const _Blob({required this.size, required this.color});

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color,
        ),
      );
}

class _FeaturePill extends StatelessWidget {
  final IconData icon;
  final String label;
  const _FeaturePill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.white24),
          borderRadius: BorderRadius.circular(30),
          color: Colors.white.withOpacity(0.06),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white70, size: 14),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
}