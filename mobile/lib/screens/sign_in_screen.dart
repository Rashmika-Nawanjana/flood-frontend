import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';

class SignInScreen extends StatelessWidget {
  const SignInScreen({super.key});

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
          backgroundColor: Color(0xFF0D1B2A),
          body: Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation(Color(0xFF42A5F5)),
            ),
          ),
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
                      Navigator.pushNamed(context, '/sign-up');
                    },
                    child: const Text(
                      "Don't have an account? Sign up",
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