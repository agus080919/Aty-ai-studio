import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int tab = 0;
  final prompt = TextEditingController();
  String ratio = '9:16';
  bool busy = false;
  String result = '';
  String error = '';

  Future<void> run(String type) async {
    if (prompt.text.trim().length < 3) {
      setState(() => error = 'Tulis prompt minimal 3 karakter.');
      return;
    }
    setState(() {
      busy = true;
      error = '';
      result = '';
    });
    try {
      final data = await ApiService.generate(
        type: type,
        prompt: prompt.text.trim(),
        aspectRatio: ratio,
      );
      setState(() => result = '${ApiService.baseUrl}${data['url']}');
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  void dispose() {
    prompt.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ATY AI STUDIO',
            style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
              onPressed: () {}, icon: const Icon(Icons.account_circle_outlined))
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  colors: [Color(0xFF402080), Color(0xFF152C55)]),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('KREATIVITAS TANPA BATAS',
                      style: TextStyle(fontSize: 12, letterSpacing: 1.5)),
                  SizedBox(height: 8),
                  Text('Ubah ide menjadi karya AI',
                      style:
                          TextStyle(fontSize: 23, fontWeight: FontWeight.bold)),
                  SizedBox(height: 5),
                  Text('Buat gambar, video, dan suara dari satu studio.'),
                ]),
          ),
          const SizedBox(height: 22),
          const Text('Pilih generator',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: [
            _chip('Video', 0, Icons.video_library),
            _chip('Gambar', 1, Icons.image),
            _chip('Suara', 2, Icons.record_voice_over),
            _chip('Image to Video', 3, Icons.movie_creation_outlined),
          ]),
          const SizedBox(height: 18),
          TextField(
            controller: prompt,
            maxLines: 5,
            decoration: InputDecoration(
              labelText: 'Tulis deskripsi karya',
              hintText:
                  'Contoh: Seekor burung berkicau di dahan pohon saat matahari pagi...',
              border:
                  OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: ratio,
            decoration: const InputDecoration(labelText: 'Rasio hasil'),
            items: ['9:16', '16:9', '1:1']
                .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                .toList(),
            onChanged: (v) => setState(() => ratio = v ?? '9:16'),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: busy ? null : () => run(tab == 1 ? 'image' : 'video'),
            icon: busy
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.auto_awesome),
            label: Text(busy
                ? 'Memproses...'
                : tab == 1
                    ? 'Buat Gambar'
                    : 'Buat Video'),
          ),
          if (tab == 2)
            const Padding(
              padding: EdgeInsets.only(top: 10),
              child: Text(
                  'Generator suara tersedia melalui endpoint /v1/speech; UI suara akan disambungkan pada tahap berikutnya.'),
            ),
          if (tab == 3)
            const Padding(
              padding: EdgeInsets.only(top: 10),
              child: Text(
                  'Image to Video memerlukan unggahan gambar dan provider yang mendukung model I2V. Integrasi ini belum diaktifkan pada starter build.'),
            ),
          if (error.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child:
                  Text(error, style: const TextStyle(color: Colors.redAccent)),
            ),
          if (result.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 14),
              child: SelectableText('Hasil tersimpan di server: $result'),
            ),
          const SizedBox(height: 24),
          const Text(
              'Catatan: hasil generasi memerlukan backend dan token provider yang sudah dikonfigurasi.',
              style: TextStyle(color: Colors.white60, fontSize: 12)),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 0,
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.home_outlined), label: 'Beranda'),
          NavigationDestination(
              icon: Icon(Icons.video_library_outlined), label: 'Proyek'),
          NavigationDestination(
              icon: Icon(Icons.photo_library_outlined), label: 'Galeri'),
          NavigationDestination(
              icon: Icon(Icons.settings_outlined), label: 'Pengaturan'),
        ],
        onDestinationSelected: (i) {
          if (i == 0) return;
          if (i == 3) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const SettingsScreen(),
              ),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  i == 1
                      ? 'Halaman Proyek sedang disiapkan.'
                      : 'Halaman Galeri sedang disiapkan.',
                ),
              ),
            );
          }
        },
      ),
    );
  }

  Widget _chip(String label, int value, IconData icon) => ChoiceChip(
        selected: tab == value,
        avatar: Icon(icon, size: 18),
        label: Text(label),
        onSelected: (_) => setState(() => tab = value),
      );
}
