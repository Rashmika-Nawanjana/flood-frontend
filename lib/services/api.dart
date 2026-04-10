class ApiService {
  static const String devBaseUrl = 'http://localhost:8000';
  static const String stagingBaseUrl = 'https://api-stg.example.com';
  static const String prodBaseUrl = 'https://api.example.com';

  Future<String> healthLabel() async {
    // Placeholder call label while backend integration is in progress.
    return 'Frontend Running - backend: GET /health';
  }
}
