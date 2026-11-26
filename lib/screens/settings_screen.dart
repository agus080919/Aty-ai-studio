import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final serverController = TextEditingController();
  String ratio = '9:16';
  String quality = '1080p';
  String duration = '15 detik';
  bool loading = true;
  bool saving = false;
  String? loadError;

  @override
  void initState() {
    super.initState();
    loadSettings();
  }

  Future<void> loadSettings() async {
    setState(() {
      loading = true;
      loadError = null;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      if (!mounted) return;

      serverController.text = prefs.getString('server_url') ?? '';
      setState(() {
        ratio = prefs.getString('ratio') ?? '9:16';
        quality = prefs.getString('quality') ?? '1080p';
        duration = prefs.getString('duration') ?? '15 detik';
        loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        loading = false;
        loadError = 'Gagal memuat pengaturan: $error';
      });
    }
  }

  Future<void> saveSettings() async {
    setState(() => saving = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('server_url', serverController.text.trim());
      await prefs.setString('ratio', ratio);
      await prefs.setString('quality', quality);
      await prefs.setString('duration', duration);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pengaturan berhasil disimpan')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal menyimpan pengaturan: $error')),
      );
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  void dispose() {
    serverController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (loadError != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Pengaturan')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(loadError!, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: loadSettings,
                  child: const Text('Coba lagi'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Pengaturan')),
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          const Text(
            'SERVER AI',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: serverController,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(
              labelText: 'Alamat server HTTPS',
              hintText: 'https://server-kamu.com',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 22),
          const Text(
            'RASIO VIDEO',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          DropdownButtonFormField<String>(
            value: ratio,
            items: ['9:16', '16:9', '1:1']
                .map((value) => DropdownMenuItem(
                      value: value,
                      child: Text(value),
                    ))
                .toList(),
            onChanged: (value) => setState(() => ratio = value ?? '9:16'),
          ),
          const SizedBox(height: 18),
          const Text(
            'KUALITAS',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          DropdownButtonFormField<String>(
            value: quality,
            items: ['720p', '1080p', '2K', '4K']
                .map((value) => DropdownMenuItem(
                      value: value,
                      child: Text(value),
                    ))
                .toList(),
            onChanged: (value) => setState(() => quality = value ?? '1080p'),
          ),
          const SizedBox(height: 18),
          const Text(
            'DURASI VIDEO',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          DropdownButtonFormField<String>(
            value: duration,
            items: ['5 detik', '10 detik', '15 detik', '30 detik']
                .map((value) => DropdownMenuItem(
                      value: value,
                      child: Text(value),
                    ))
                .toList(),
            onChanged: (value) =>
                setState(() => duration = value ?? '15 detik'),
          ),
          const SizedBox(height: 28),
          FilledButton.icon(
            onPressed: saving ? null : saveSettings,
            icon: const Icon(Icons.save),
            label: Text(saving ? 'MENYIMPAN...' : 'SIMPAN PENGATURAN'),
          ),
        ],
      ),
    );
  }
}
