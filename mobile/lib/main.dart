import 'package:flood_frontend/screens/splash_screen.dart';
import 'package:flutter/material.dart';


void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});


  @override
  Widget build(BuildContext context) {
    // Definining Colors from the UI Contract
    const Color primaryBlue = Color(0xFF1565C0);
    const Color backgroundGray = Color(0xFFF5F7FA);

    return MaterialApp(
      title: 'Flood Alert LK',
      theme: ThemeData(
        scaffoldBackgroundColor: backgroundGray,
        primaryColor: primaryBlue,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF1F2937), // Text Primary
          elevation: 0,
        ),
        useMaterial3: true,
      ),
      home: SplashScreen(),
    );
  }
}
