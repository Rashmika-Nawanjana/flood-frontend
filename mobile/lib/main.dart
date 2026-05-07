import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flood_frontend/screens/home.dart';
import 'package:flood_frontend/screens/sign_in_screen.dart';
import 'package:flutter/material.dart';


void main() async {

  WidgetsFlutterBinding.ensureInitialized();

  await Clerk.initialize(
    publishableKey: 'pk_test_xxxxxxxxxxxxxxxxx',
  );

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

      routes: {

        '/home': (context) =>
            const HomeScreen(
              locationIdentifier: "USE_GPS_LOCATION",
            ),
      },

      home: const SignInScreen(),
    );
  }
}
