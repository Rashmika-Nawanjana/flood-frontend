import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';

import 'role_gate.dart';

class SignUpScreen extends StatelessWidget {
  const SignUpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ClerkAuthBuilder(
      signedInBuilder: (context, authState) {
        return const RoleGate();
      },

      signedOutBuilder: (context, authState) {
        return Scaffold(
          backgroundColor: const Color(0xFF0D1B2A),
          body: const SafeArea(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: ClerkAuthentication(),
            ),
          ),
        );
      },
    );
  }
}