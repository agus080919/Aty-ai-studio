import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Ganti dengan URL backend HTTPS milikmu setelah backend dipasang.
  static const String baseUrl = String.fromEnvironment(
    'ATY_API_URL',
    defaultValue: 'https://YOUR-BACKEND-DOMAIN',
  );

  static Future<Map<String, dynamic>> generate({
    required String type,
    required String prompt,
    String aspectRatio = '9:16',
  }) async {
    if (baseUrl.contains('YOUR-BACKEND-DOMAIN')) {
      throw Exception('Alamat server belum diatur. Lihat README.');
    }
    final response = await http.post(
      Uri.parse('$baseUrl/v1/$type'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'prompt': prompt, 'aspect_ratio': aspectRatio}),
    ).timeout(const Duration(minutes: 10));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Server ${response.statusCode}: ${response.body}');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}
