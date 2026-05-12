import 'package:clerk_auth/clerk_auth.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flood_frontend/screens/signup.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'screens/access_restricted_screen.dart';
import 'screens/sign_in_screen.dart';
import 'screens/splash_screen.dart';
import 'services/socket_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Transparent status bar
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(const MyRootApp());
}

class MyRootApp extends StatelessWidget {
  const MyRootApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ClerkAuth(
      config: ClerkAuthConfig(
        publishableKey:
            'pk_test_dXNlZnVsLWhlbi0xMy5jbGVyay5hY2NvdW50cy5kZXYk',

        persistor: Persistor.none,
      ),
      child: const FloodSenseApp(),
    );
  }
}

class FloodSenseApp extends StatefulWidget {
  const FloodSenseApp({super.key});

  @override
  State<FloodSenseApp> createState() => _FloodSenseAppState();
}

class _FloodSenseAppState extends State<FloodSenseApp> {
  @override
  void dispose() {
      SocketService.instance.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FloodSense LK',
      debugShowCheckedModeBanner: false,
      theme: _buildTheme(),

      routes: {
        '/sign-in': (context) => const SignInScreen(),
        '/sign-up': (context) => const SignUpScreen(),
        '/onboarding': (context) => const SplashScreen(),
        '/access-restricted': (context) => const AccessRestrictedScreen(),
      },

      home: const SignInScreen(),
    );
  }

  ThemeData _buildTheme() {
    const primaryBlue = Color(0xFF1565C0);
    const bgGray = Color(0xFFF3F4F6);

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: bgGray,
      primaryColor: primaryBlue,
      fontFamily: 'Outfit',
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryBlue,
        brightness: Brightness.light,
      ),
    );
  }
}