import 'package:flutter/material.dart';

import '../services/api.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Flood System')),
      body: Center(
        child: FutureBuilder<String>(
          future: ApiService().healthLabel(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const CircularProgressIndicator();
            }
            return Text(snapshot.data ?? 'Frontend Running');
          },
        ),
      ),
    );
  }
}
