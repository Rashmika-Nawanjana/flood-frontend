import 'package:flutter/material.dart';
import 'package:clerk_flutter/clerk_flutter.dart';

class SignInScreen extends StatelessWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sign In'),
      ),
      body: Center(
        child: SignIn(
          afterSignIn: (context) {
            Navigator.pushReplacementNamed(context, '/home');
          },
        ),
      ),
    );
  }
}