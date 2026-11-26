import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // TODO: Setelah membuat proyek Firebase, aktifkan Firebase.initializeApp()
  // menggunakan file firebase_options.dart hasil perintah flutterfire configure.
  runApp(const AtyApp());
}

class AtyApp extends StatelessWidget {
  const AtyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ATY AI STUDIO',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF8B5CF6),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF10101A),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
