import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';

class SignUpScreen extends StatelessWidget {
  const SignUpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ClerkAuthBuilder(
      signedInBuilder: (context, authState) {
        Future.microtask(() {
          if (context.mounted) {
            Navigator.pushReplacementNamed(context, '/onboarding');
          }
        });

        return const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        );
      },

      signedOutBuilder: (context, authState) {
        return Scaffold(
          backgroundColor: const Color(0xFF0D1B2A),
          body: Center(
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [

                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: ClerkAuthentication(),
                  ),

                  const SizedBox(height: 20),

                  TextButton(
                    onPressed: () {
                      Navigator.pushNamed(context, '/sign-in');
                    },
                    child: const Text(
                      "Already have an account? Sign in",
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}