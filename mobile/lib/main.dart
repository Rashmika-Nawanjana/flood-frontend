import 'package:clerk_auth/clerk_auth.dart' show Persistor;
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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

  runApp(
    ClerkAuth(
      config: ClerkAuthConfig(
        publishableKey: 'pk_test...', // ← replace the key
        persistor: Persistor.none,
      ),
      child: const FloodSenseApp(),
    ),
  );
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
        '/onboarding': (context) => const SplashScreen(),
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
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryBlue,
        brightness: Brightness.light,
      ),
      fontFamily: 'Outfit',
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF1F2937),
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: 'Outfit',
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: Color(0xFF1F2937),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          textStyle: const TextStyle(
            fontFamily: 'Outfit',
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryBlue,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          textStyle: const TextStyle(
            fontFamily: 'Outfit',
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        color: Colors.white,
      ),
    );
  }
}