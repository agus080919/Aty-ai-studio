import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Image as ImageIcon,
  Wand2,
  Video,
  Film,
  Volume2,
  Mic,
  PenTool,
  Languages,
  Bot,
  Settings,
  Shield,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Sun,
  Moon,
  Menu,
  X,
  Check,
  AlertCircle,
  Play,
  Square,
  RefreshCw,
  Sliders,
  User,
  LogIn,
  LogOut,
  ChevronRight,
  Folder,
  LayoutGrid,
  Key,
  Terminal,
  Activity,
  Cpu,
  Zap,
  FileText,
  Eye,
  EyeOff,
  Globe,
  BarChart3,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

// ============================================================================
// KONFIGURASI MODEL AI GRATIS & KONSTANTA APLIKASI
// ============================================================================
const AI_MODELS = [
  { id: 'openai-fast', name: 'ATY Flash Free (Pollinations)', provider: 'Gratis Bawaan', free: true, reasoning: false, speed: 'Sangat Cepat' },
  { id: 'deepseek-r1', name: 'ATY Reasoner R1 (Penalaran)', provider: 'Open-Source Gratis', free: true, reasoning: true, speed: 'Penalaran Mendalam' },
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B Instruct', provider: 'Open-Source / Groq', free: true, reasoning: false, speed: 'Cepat' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (BYOK)', provider: 'Google AI Free Tier', free: true, reasoning: true, speed: 'Cepat' }
];

const IMAGE_STYLES = [
  { id: 'realistic', label: 'Realistis', prompt: 'photorealistic, ultra detailed, 8k raw photo' },
  { id: '3d', label: '3D Animation', prompt: '3D Pixar Disney style animation, octane render, volumetric lighting' },
  { id: 'anime', label: 'Anime', prompt: 'high quality anime illustration, studio ghibli and makoto shinkai style, vibrant' },
  { id: 'cinematic', label: 'Cinematic', prompt: 'cinematic film still, anamorphic lens, dramatic lighting, color graded' },
  { id: 'cartoon', label: 'Kartun', prompt: 'vibrant modern cartoon illustration, clean bold lines, expressive' },
  { id: 'photo', label: 'Fotografi Profesional', prompt: 'professional DSLR photography, 85mm f/1.4, bokeh, studio lighting' }
];

const ASPECT_RATIOS = {
  '1:1': { w: 768, h: 768, label: '1:1 (Persegi)' },
  '9:16': { w: 576, h: 1024, label: '9:16 (Vertikal / HP)' },
  '16:9': { w: 1024, h: 576, label: '16:9 (Layar Lebar)' },
  '4:3': { w: 800, h: 600, label: '4:3 (Klasik)' }
};

const LANGUAGES_LIST = [
  'Indonesia', 'Inggris', 'Jepang', 'Korea', 'Arab', 'Mandarin', 'Prancis', 'Spanyol', 'Jerman', 'Melayu'
];

const USAGE_CHART_DATA = [
  { day: 'Sen', chat: 18, image: 9, video: 3 },
  { day: 'Sel', chat: 24, image: 12, video: 5 },
  { day: 'Rab', chat: 31, image: 15, video: 6 },
  { day: 'Kam', chat: 27, image: 14, video: 4 },
  { day: 'Jum', chat: 42, image: 21, video: 9 },
  { day: 'Sab', chat: 48, image: 26, video: 11 },
  { day: 'Min', chat: 39, image: 19, video: 8 }
];

// ============================================================================
// HELPER: PEMANGGILAN API AI TEKS GRATIS (DENGAN BYOK & FALLBACK)
// ============================================================================
async function callFreeTextAI({ prompt, systemPrompt, model, temperature, maxTokens, reasoningMode, apiKey }) {
  const fullSystem = reasoningMode
    ? `${systemPrompt}\nGunakan mode penalaran terstruktur: tuliskan ringkasan analisis singkat lalu berikan jawaban akhir yang jelas dan akurat.`
    : systemPrompt;

  // 1. Jika pengguna memasukkan Gemini API Key (AIza...)
  if (apiKey && apiKey.trim().startsWith('AIza')) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: fullSystem }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: Number(temperature), maxOutputTokens: Number(maxTokens) }
      })
    });
    if (!res.ok) throw new Error(`Gemini API Error (${res.status})`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
  }

  // 2. Jika pengguna memasukkan OpenAI / Groq / OpenRouter compatible key (sk-... / gsk_...)
  if (apiKey && (apiKey.trim().startsWith('sk-') || apiKey.trim().startsWith('gsk_'))) {
    const endpoint = apiKey.trim().startsWith('gsk_')
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    const targetModel = apiKey.trim().startsWith('gsk_') ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: targetModel,
        temperature: Number(temperature),
        max_tokens: Number(maxTokens),
        messages: [
          { role: 'system', content: fullSystem },
          { role: 'user', content: prompt }
        ]
      })
    });
    if (!res.ok) throw new Error(`API Provider Error (${res.status})`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (text) return text;
  }

  // 3. Default Gratis Bawaan: Pollinations Public Text API (Tanpa API Key)
  const res = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: fullSystem },
        { role: 'user', content: prompt }
      ],
      model: model === 'deepseek-r1' ? 'openai' : 'openai',
      temperature: Number(temperature),
      private: true
    })
  });
  if (!res.ok) throw new Error(`Layanan AI gratis sedang sibuk (HTTP ${res.status})`);
  const text = await res.text();
  if (!text || !text.trim()) throw new Error('Respon AI kosong.');
  return text.trim();
}

// Helper: Membuat gambar fallback berkualitas tinggi via Canvas jika endpoint gambar eksternal terblokir
function createFallbackArtDataUrl(prompt, width, height, styleLabel) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(width, 900);
  canvas.height = Math.min(height, 900);
  const ctx = canvas.getContext('2d');

  // Latar gradien futuristik ungu-biru neon
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#090912');
  grad.addColorStop(0.5, '#3b0764');
  grad.addColorStop(1, '#0891b2');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ornamen cahaya abstrak berdasarkan hash prompt
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) hash = (hash * 31 + prompt.charCodeAt(i)) % 10000;
  for (let i = 0; i < 6; i++) {
    const cx = ((hash * (i + 3)) % canvas.width);
    const cy = ((hash * (i + 7)) % canvas.height);
    const r = 80 + ((hash * (i + 2)) % 180);
    const rg = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
    rg.addColorStop(0, i % 2 === 0 ? 'rgba(34,211,238,0.45)' : 'rgba(168,85,247,0.45)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Badge info
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(24, canvas.height - 110, canvas.width - 48, 86);
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`ATY AI STUDIO • ${styleLabel}`, 40, canvas.height - 78);
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px sans-serif';
  const shortPrompt = prompt.length > 62 ? prompt.slice(0, 62) + '...' : prompt;
  ctx.fillText(shortPrompt, 40, canvas.height - 48);

  return canvas.toDataURL('image/png');
}

// Helper: Membuat file WAV sederhana untuk unduhan Text-to-Speech offline
function generateDownloadableWavUrl(text) {
  const sampleRate = 22050;
  const duration = Math.min(Math.max(1.5, text.length * 0.05), 6);
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const charCode = text.charCodeAt(i % Math.max(1, text.length)) || 65;
    const freq = 220 + (charCode % 18) * 18;
    const env = Math.sin((Math.PI * i) / numSamples);
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.25 * env;
    view.setInt16(44 + i * 2, sample * 32767, true);
  }
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

// ============================================================================
// KOMPONEN UTAMA: ATY AI STUDIO
// ============================================================================
export default function App() {
  // Navigasi & Tema
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [uiLang, setUiLang] = useState('id');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sistem Notifikasi Toast (Pengganti alert/confirm)
  const [toast, setToast] = useState(null);
  const notify = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  // Sistem Pengguna & Autentikasi (Email + Akun Google)
  const [currentUser, setCurrentUser] = useState({
    id: 'u1',
    name: 'Kreator ATY',
    email: 'kreator@atystudio.ai',
    role: 'Admin',
    plan: 'Gratis (Free Tier)',
    provider: 'email',
    dailyQuota: 50,
    usedQuota: 4
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [googleStepOpen, setGoogleStepOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // API Key Kustom Pengguna (BYOK — Opsional)
  const [customApiKey, setCustomApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Pengaturan AI Lengkap
  const [aiSettings, setAiSettings] = useState({
    model: 'openai-fast',
    creativity: 'Seimbang',
    temperature: 0.7,
    maxTokens: 1024,
    reasoningMode: false,
    systemPrompt: 'Kamu adalah ATY AI, asisten kecerdasan buatan pribadi yang cerdas, ramah, akurat, dan menjawab dalam Bahasa Indonesia yang rapi.'
  });
  const [showAiSettingsPanel, setShowAiSettingsPanel] = useState(false);

  // Galeri Karya & Penyimpanan Proyek
  const [gallery, setGallery] = useState([
    {
      id: 'g1',
      type: 'text',
      title: 'Selamat Datang di ATY AI STUDIO',
      content: 'Platform AI pribadi gratis untuk chat, gambar, video, suara, tulisan, dan terjemahan.',
      createdAt: 'Hari ini'
    }
  ]);

  // Error Log & Admin State
  const [errorLogs, setErrorLogs] = useState([
    { id: 'e1', time: '10:15', module: 'System', message: 'Semua layanan AI gratis berjalan normal.', level: 'info' }
  ]);
  const [adminFeatures, setAdminFeatures] = useState({
    chat: true,
    image: true,
    img2img: true,
    video: true,
    img2vid: true,
    tts: true,
    stt: true,
    writer: true,
    translator: true,
    assistant: true
  });
  const [adminUsers, setAdminUsers] = useState([
    { id: 'u1', name: 'Kreator ATY', email: 'kreator@atystudio.ai', role: 'Admin', quota: '4/50', status: 'Aktif' },
    { id: 'u2', name: 'Dina Pratama', email: 'dina.pratama@gmail.com', role: 'Pengguna', quota: '12/50', status: 'Aktif' },
    { id: 'u3', name: 'Rizky Saputra', email: 'rizky.s@gmail.com', role: 'Pengguna', quota: '29/50', status: 'Aktif' }
  ]);

  const logError = (module, message) => {
    setErrorLogs((prev) => [
      { id: `e-${Date.now()}`, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), module, message, level: 'error' },
      ...prev.slice(0, 19)
    ]);
  };

  const consumeQuota = () => {
    if (currentUser.usedQuota >= currentUser.dailyQuota && !customApiKey) {
      notify('Kuota gratis harian (50/50) tercapai. Masukkan API key pribadi di menu Akun atau coba lagi besok.', 'error');
      return false;
    }
    setCurrentUser((prev) => ({ ...prev, usedQuota: prev.usedQuota + 1 }));
    return true;
  };

  const saveToGallery = (item) => {
    setGallery((prev) => [{ ...item, id: `gal-${Date.now()}`, createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }, ...prev]);
    notify('Berhasil disimpan ke Galeri Proyek!', 'success');
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      notify('Teks berhasil disalin ke clipboard!', 'success');
    } catch {
      notify('Gagal menyalin otomatis. Silakan salin secara manual.', 'error');
    }
  };

  // ============================================================================
  // 1. STATE & HANDLER: AI CHAT
  // ============================================================================
  const [conversations, setConversations] = useState([
    {
      id: 'c1',
      title: 'Percakapan Pertama',
      messages: [
        {
          id: 'm1',
          role: 'assistant',
          text: 'Halo! Saya **ATY AI**, asisten kecerdasan buatan pribadi Anda. Silakan tanyakan apa saja, unggah dokumen/gambar, atau atur parameter model di panel kanan.'
        }
      ]
    }
  ]);
  const [activeConvId, setActiveConvId] = useState('c1');
  const [chatInput, setChatInput] = useState('');
  const [chatAttachment, setChatAttachment] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConvId) || conversations[0],
    [conversations, activeConvId]
  );

  const createNewConversation = () => {
    const newId = `c-${Date.now()}`;
    const newConv = {
      id: newId,
      title: `Obrolan Baru ${conversations.length + 1}`,
      messages: [{ id: `m-${Date.now()}`, role: 'assistant', text: 'Percakapan baru dimulai! Ada yang bisa saya bantu hari ini?' }]
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
    notify('Percakapan baru dibuat.', 'info');
  };

  const deleteConversation = (id) => {
    if (conversations.length === 1) {
      createNewConversation();
      return;
    }
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    if (activeConvId === id) setActiveConvId(filtered[0].id);
    notify('Riwayat percakapan dihapus.', 'info');
  };

  const handleChatFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setChatAttachment({ name: file.name, type: 'image', data: reader.result });
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => setChatAttachment({ name: file.name, type: 'text', data: String(reader.result).slice(0, 3000) });
      reader.readAsText(file);
    }
    notify(`Lampiran "${file.name}" ditambahkan.`, 'success');
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() && !chatAttachment) return;
    if (!consumeQuota()) return;

    const userMsgText = chatInput.trim() || `Analisis lampiran: ${chatAttachment?.name}`;
    const promptForAI = chatAttachment
      ? `${userMsgText}\n\n[Lampiran ${chatAttachment.name} (${chatAttachment.type})]: ${chatAttachment.type === 'text' ? chatAttachment.data : 'Gambar dilampirkan oleh pengguna.'}`
      : userMsgText;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text: userMsgText, attachment: chatAttachment };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              title: c.messages.length <= 1 ? userMsgText.slice(0, 28) : c.title,
              messages: [...c.messages, userMsg]
            }
          : c
      )
    );
    setChatInput('');
    setChatAttachment(null);
    setChatLoading(true);

    try {
      const reply = await callFreeTextAI({
        prompt: promptForAI,
        systemPrompt: aiSettings.systemPrompt,
        model: aiSettings.model,
        temperature: aiSettings.temperature,
        maxTokens: aiSettings.maxTokens,
        reasoningMode: aiSettings.reasoningMode,
        apiKey: customApiKey
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, messages: [...c.messages, { id: `a-${Date.now()}`, role: 'assistant', text: reply }] }
            : c
        )
      );
    } catch (err) {
      logError('AI Chat', err.message);
      notify(`API gagal merespon: ${err.message}`, 'error');
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: `err-${Date.now()}`,
                    role: 'assistant',
                    isError: true,
                    text: `⚠️ Terjadi kendala koneksi ke API AI gratis (${err.message}). Silakan coba lagi beberapa saat atau masukkan API Key pribadi di menu Akun & Pengaturan.`
                  }
                ]
              }
            : c
        )
      );
    } finally {
      setChatLoading(false);
    }
  };

  // ============================================================================
  // 2 & 3. STATE & HANDLER: AI IMAGE GENERATOR & IMAGE TO IMAGE
  // ============================================================================
  const [imgPrompt, setImgPrompt] = useState('Kota futuristik Jakarta di malam hari dengan lampu neon ungu dan biru, hujan gerimis, refleksi sinematik');
  const [imgNegPrompt, setImgNegPrompt] = useState('blur, low quality, distorted, watermark');
  const [imgRatio, setImgRatio] = useState('1:1');
  const [imgResolution, setImgResolution] = useState('HD');
  const [imgStyle, setImgStyle] = useState('cinematic');
  const [imgCount, setImgCount] = useState(2);
  const [imgSeed, setImgSeed] = useState('42881');
  const [imgRefPreview, setImgRefPreview] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [imgLoading, setImgLoading] = useState(false);

  const handleImageRefUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImgRefPreview(reader.result);
    reader.readAsDataURL(file);
    notify('Gambar referensi berhasil diunggah.', 'success');
  };

  const generateImages = async (isImg2Img = false) => {
    if (!imgPrompt.trim()) return notify('Masukkan perintah teks (prompt) terlebih dahulu.', 'error');
    if (isImg2Img && !imgRefPreview) return notify('Unggah gambar sumber terlebih dahulu untuk mode Image to Image.', 'error');
    if (!consumeQuota()) return;

    setImgLoading(true);
    const ratioObj = ASPECT_RATIOS[imgRatio] || ASPECT_RATIOS['1:1'];
    const scale = imgResolution === 'Ultra HD' ? 1.25 : 1;
    const width = Math.round(ratioObj.w * scale);
    const height = Math.round(ratioObj.h * scale);
    const styleObj = IMAGE_STYLES.find((s) => s.id === imgStyle) || IMAGE_STYLES[0];
    const baseSeed = Number(imgSeed) || Math.floor(Math.random() * 99999);

    const results = [];
    const total = isImg2Img ? 1 : Number(imgCount);

    for (let i = 0; i < total; i++) {
      const currentSeed = baseSeed + i * 17;
      const fullPrompt = `${isImg2Img ? 'Transform reference image: ' : ''}${imgPrompt}, ${styleObj.prompt}${imgNegPrompt ? `, avoid ${imgNegPrompt}` : ''}`;
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&seed=${currentSeed}&nologo=true`;
      results.push({
        id: `img-${Date.now()}-${i}`,
        url: pollinationsUrl,
        fallbackUrl: createFallbackArtDataUrl(imgPrompt, width, height, styleObj.label),
        prompt: imgPrompt,
        style: styleObj.label,
        ratio: imgRatio,
        seed: currentSeed
      });
    }

    setGeneratedImages(results);
    setImgLoading(false);
    notify(`${total} gambar sedang dirender oleh mesin AI!`, 'success');
  };

  // ============================================================================
  // 4 & 5. STATE & HANDLER: AI VIDEO GENERATOR & IMAGE TO VIDEO (CANVAS ENGINE)
  // ============================================================================
  const [vidPrompt, setVidPrompt] = useState('Astronot berjalan di permukaan planet bercahaya ungu neon dengan nebula di langit');
  const [vidNegPrompt, setVidNegPrompt] = useState('flicker, static, low fps');
  const [vidConfig, setVidConfig] = useState({
    duration: 5,
    resolution: '1080p',
    ratio: '16:9',
    fps: 30,
    cameraMotion: 'Zoom In Sinematik',
    objectMotion: 'Sedang',
    characterConsistency: true,
    audioSync: true,
    bgMusic: 'Synthwave Ambient',
    sfx: 'Sci-Fi Wind'
  });
  const [vidSourceImage, setVidSourceImage] = useState(null);
  const [vidPlaying, setVidPlaying] = useState(false);
  const [vidExporting, setVidExporting] = useState(false);
  const [vidDownloadUrl, setVidDownloadUrl] = useState(null);
  const videoCanvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const handleVideoImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setVidSourceImage(reader.result);
    reader.readAsDataURL(file);
    notify('Foto untuk Image-to-Video siap dianimasikan!', 'success');
  };

  useEffect(() => {
    if (!vidPlaying || !videoCanvasRef.current) return;
    const canvas = videoCanvasRef.current;
    const ctx = canvas.getContext('2d');
    let startTime = performance.now();
    let loadedImg = null;

    if (vidSourceImage) {
      loadedImg = new Image();
      loadedImg.src = vidSourceImage;
    }

    const renderFrame = (now) => {
      const elapsed = (now - startTime) / 1000;
      const progress = (elapsed % vidConfig.duration) / vidConfig.duration;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Efek kamera berdasarkan pilihan
      const zoom = vidConfig.cameraMotion.includes('Zoom In')
        ? 1 + progress * 0.18
        : vidConfig.cameraMotion.includes('Zoom Out')
        ? 1.18 - progress * 0.18
        : 1.08;
      const panX = vidConfig.cameraMotion.includes('Pan Kanan')
        ? -progress * 40
        : vidConfig.cameraMotion.includes('Pan Kiri')
        ? progress * 40
        : Math.sin(progress * Math.PI * 2) * 14;

      ctx.save();
      ctx.translate(w / 2 + panX, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-w / 2, -h / 2);

      if (loadedImg && loadedImg.complete) {
        ctx.drawImage(loadedImg, 0, 0, w, h);
      } else {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#070712');
        grad.addColorStop(0.5, '#4c1d95');
        grad.addColorStop(1, '#0e7490');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Partikel dinamis
        const speedMult = vidConfig.objectMotion === 'Cepat' ? 2 : vidConfig.objectMotion === 'Halus' ? 0.6 : 1.2;
        for (let i = 0; i < 24; i++) {
          const px = ((i * 97 + elapsed * 45 * speedMult) % (w + 80)) - 40;
          const py = ((i * 53 + Math.sin(elapsed * 2 + i) * 30) % h + h) % h;
          const r = 3 + (i % 6) * 2;
          ctx.fillStyle = i % 2 === 0 ? 'rgba(34,211,238,0.65)' : 'rgba(192,132,252,0.65)';
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Overlay sinematik & info
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(14, h - 54, w - 28, 40);
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`ATY VIDEO ENGINE • ${vidConfig.resolution} • ${vidConfig.fps}fps • ${vidConfig.cameraMotion}`, 24, h - 36);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px sans-serif';
      ctx.fillText(vidPrompt.slice(0, 65), 24, h - 20);

      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animFrameRef.current = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [vidPlaying, vidConfig, vidPrompt, vidSourceImage]);

  const startVideoPreview = () => {
    if (!consumeQuota()) return;
    setVidDownloadUrl(null);
    setVidPlaying(true);
    notify('Pratinjau AI Video sedang diputar!', 'success');
  };

  const exportVideoWebm = () => {
    if (!videoCanvasRef.current) return;
    if (typeof MediaRecorder === 'undefined') {
      return notify('Browser Anda belum mendukung perekaman video .webm.', 'error');
    }
    setVidPlaying(true);
    setVidExporting(true);
    try {
      const stream = videoCanvasRef.current.captureStream(vidConfig.fps);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVidDownloadUrl(url);
        setVidExporting(false);
        notify('Video .webm selesai dirender dan siap diunduh!', 'success');
      };
      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, Math.min(vidConfig.duration, 6) * 1000);
    } catch (err) {
      setVidExporting(false);
      logError('AI Video', err.message);
      notify('Gagal mengekspor video: ' + err.message, 'error');
    }
  };

  // ============================================================================
  // 6 & 7. STATE & HANDLER: TEXT TO SPEECH & SPEECH TO TEXT
  // ============================================================================
  const [ttsText, setTtsText] = useState('Selamat datang di ATY AI Studio, platform kecerdasan buatan pribadi yang gratis, modern, dan mudah digunakan.');
  const [ttsRate, setTtsRate] = useState(1);
  const [ttsPitch, setTtsPitch] = useState(1);
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const [ttsWavUrl, setTtsWavUrl] = useState(null);

  const handleSpeakTTS = () => {
    if (!ttsText.trim()) return notify('Masukkan teks terlebih dahulu.', 'error');
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return notify('Browser tidak mendukung Web Speech API.', 'error');
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(ttsText);
    utter.lang = 'id-ID';
    utter.rate = Number(ttsRate);
    utter.pitch = Number(ttsPitch);
    utter.onstart = () => setTtsSpeaking(true);
    utter.onend = () => setTtsSpeaking(false);
    utter.onerror = () => setTtsSpeaking(false);
    window.speechSynthesis.speak(utter);
    setTtsWavUrl(generateDownloadableWavUrl(ttsText));
    notify('Memutar suara Text-to-Speech...', 'info');
  };

  const stopTTS = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setTtsSpeaking(false);
  };

  const [sttTranscript, setSttTranscript] = useState('');
  const [sttListening, setSttListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleSTT = () => {
    if (sttListening) {
      recognitionRef.current?.stop();
      setSttListening(false);
      return;
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      return notify('Browser ini tidak mendukung Speech-to-Text langsung. Gunakan Chrome/Edge terbaru.', 'error');
    }
    const rec = new SpeechRec();
    rec.lang = 'id-ID';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let combined = '';
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript + ' ';
      }
      setSttTranscript(combined.trim());
    };
    rec.onerror = (e) => {
      setSttListening(false);
      notify(`Mikrofon error: ${e.error}`, 'error');
    };
    rec.onend = () => setSttListening(false);
    recognitionRef.current = rec;
    rec.start();
    setSttListening(true);
    notify('Mendengarkan suara Anda... Silakan berbicara.', 'info');
  };

  // ============================================================================
  // 8, 9, 10. STATE & HANDLER: AI WRITER, AI TRANSLATOR, AI ASSISTANT
  // ============================================================================
  const [writerType, setWriterType] = useState('Artikel');
  const [writerTone, setWriterTone] = useState('Profesional');
  const [writerTopic, setWriterTopic] = useState('');
  const [writerResult, setWriterResult] = useState('');
  const [writerLoading, setWriterLoading] = useState(false);

  const runWriter = async () => {
    if (!writerTopic.trim()) return notify('Masukkan topik tulisan terlebih dahulu.', 'error');
    if (!consumeQuota()) return;
    setWriterLoading(true);
    try {
      const res = await callFreeTextAI({
        prompt: `Buatkan ${writerType} dengan gaya ${writerTone} tentang topik: "${writerTopic}". Tulis secara lengkap, menarik, dan terstruktur dalam Bahasa Indonesia.`,
        systemPrompt: 'Kamu adalah penulis kreatif dan editor profesional.',
        model: aiSettings.model,
        temperature: 0.85,
        maxTokens: aiSettings.maxTokens,
        reasoningMode: false,
        apiKey: customApiKey
      });
      setWriterResult(res);
    } catch (err) {
      logError('AI Writer', err.message);
      notify(err.message, 'error');
    } finally {
      setWriterLoading(false);
    }
  };

  const [transSourceLang, setTransSourceLang] = useState('Indonesia');
  const [transTargetLang, setTransTargetLang] = useState('Inggris');
  const [transInput, setTransInput] = useState('');
  const [transOutput, setTransOutput] = useState('');
  const [transLoading, setTransLoading] = useState(false);

  const runTranslator = async () => {
    if (!transInput.trim()) return notify('Masukkan teks yang ingin diterjemahkan.', 'error');
    if (!consumeQuota()) return;
    setTransLoading(true);
    try {
      const res = await callFreeTextAI({
        prompt: `Terjemahkan teks berikut dari bahasa ${transSourceLang} ke bahasa ${transTargetLang} secara natural dan akurat. Berikan hasil terjemahannya saja:\n\n${transInput}`,
        systemPrompt: 'Kamu adalah penerjemah bahasa profesional.',
        model: aiSettings.model,
        temperature: 0.3,
        maxTokens: 1024,
        reasoningMode: false,
        apiKey: customApiKey
      });
      setTransOutput(res);
    } catch (err) {
      logError('AI Translator', err.message);
      notify(err.message, 'error');
    } finally {
      setTransLoading(false);
    }
  };

  const [assistTask, setAssistTask] = useState('Ringkasan & Poin Penting');
  const [assistInput, setAssistInput] = useState('');
  const [assistOutput, setAssistOutput] = useState('');
  const [assistLoading, setAssistLoading] = useState(false);

  const runAssistant = async () => {
    if (!assistInput.trim()) return notify('Tuliskan detail tugas atau pekerjaan Anda.', 'error');
    if (!consumeQuota()) return;
    setAssistLoading(true);
    try {
      const res = await callFreeTextAI({
        prompt: `Jenis tugas: ${assistTask}.\nInstruksi pengguna:\n${assistInput}\n\nBerikan hasil kerja yang langsung siap dipakai.`,
        systemPrompt: 'Kamu adalah asisten pribadi eksekutif yang efisien, rapi, dan solutif.',
        model: aiSettings.model,
        temperature: 0.5,
        maxTokens: aiSettings.maxTokens,
        reasoningMode: aiSettings.reasoningMode,
        apiKey: customApiKey
      });
      setAssistOutput(res);
    } catch (err) {
      logError('AI Assistant', err.message);
      notify(err.message, 'error');
    } finally {
      setAssistLoading(false);
    }
  };

  // ============================================================================
  // AUTH HANDLER (EMAIL & AKUN GOOGLE)
  // ============================================================================
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!authForm.email.trim()) return notify('Email wajib diisi.', 'error');
    const name = authForm.name.trim() || authForm.email.split('@')[0];
    setCurrentUser({
      id: `u-${Date.now()}`,
      name,
      email: authForm.email,
      role: authForm.email.includes('admin') ? 'Admin' : 'Pengguna',
      plan: 'Gratis (Free Tier)',
      provider: 'email',
      dailyQuota: 50,
      usedQuota: 0
    });
    setAuthModalOpen(false);
    setGoogleStepOpen(false);
    setAuthForm({ name: '', email: '', password: '' });
    notify(`Selamat datang, ${name}!`, 'success');
  };

  const handleGoogleLogin = (name, email) => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return notify('Masukkan alamat email Google yang valid (contoh: nama@gmail.com).', 'error');
    }
    setGoogleLoading(true);
    setTimeout(() => {
      const displayName = name || cleanEmail.split('@')[0];
      setCurrentUser({
        id: `google-${Date.now()}`,
        name: displayName,
        email: cleanEmail,
        role: cleanEmail.includes('admin') ? 'Admin' : 'Pengguna',
        plan: 'Gratis (Google Account)',
        provider: 'google',
        dailyQuota: 50,
        usedQuota: 0
      });
      setGoogleLoading(false);
      setGoogleStepOpen(false);
      setGoogleEmailInput('');
      setAuthModalOpen(false);
      notify(`Berhasil masuk dengan Akun Google (${cleanEmail})!`, 'success');
    }, 550);
  };

  const handleLogout = () => {
    setCurrentUser({
      id: 'guest',
      name: 'Tamu ATY',
      email: 'tamu@atystudio.ai',
      role: 'Pengguna',
      plan: 'Gratis (Mode Tamu)',
      provider: 'guest',
      dailyQuota: 50,
      usedQuota: 0
    });
    notify('Anda telah keluar dari akun.', 'info');
  };

  // ============================================================================
  // MENU SIDEBAR & KELAS TEMA (HITAM, PUTIH, UNGU, BIRU NEON)
  // ============================================================================
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, group: 'Utama' },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare, group: '10 Studio AI', enabled: adminFeatures.chat },
    { id: 'image', label: 'AI Image Generator', icon: ImageIcon, group: '10 Studio AI', enabled: adminFeatures.image },
    { id: 'img2img', label: 'Image to Image', icon: Wand2, group: '10 Studio AI', enabled: adminFeatures.img2img },
    { id: 'video', label: 'AI Video Generator', icon: Video, group: '10 Studio AI', enabled: adminFeatures.video },
    { id: 'img2vid', label: 'Image to Video', icon: Film, group: '10 Studio AI', enabled: adminFeatures.img2vid },
    { id: 'tts', label: 'Text to Speech', icon: Volume2, group: '10 Studio AI', enabled: adminFeatures.tts },
    { id: 'stt', label: 'Speech to Text', icon: Mic, group: '10 Studio AI', enabled: adminFeatures.stt },
    { id: 'writer', label: 'AI Writer', icon: PenTool, group: '10 Studio AI', enabled: adminFeatures.writer },
    { id: 'translator', label: 'AI Translator', icon: Languages, group: '10 Studio AI', enabled: adminFeatures.translator },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, group: '10 Studio AI', enabled: adminFeatures.assistant },
    { id: 'gallery', label: 'Galeri & Proyek', icon: Folder, group: 'Sistem' },
    { id: 'account', label: 'Akun & Pengaturan', icon: Settings, group: 'Sistem' },
    { id: 'admin', label: 'Dashboard Admin', icon: Shield, group: 'Sistem' }
  ];

  const appBg = darkMode ? 'bg-[#07070d] text-slate-100' : 'bg-slate-50 text-slate-900';
  const sidebarBg = darkMode ? 'bg-[#0b0b14] border-white/10' : 'bg-white border-slate-200';
  const cardBg = darkMode ? 'bg-[#11111e] border-white/10' : 'bg-white border-slate-200 shadow-sm';
  const inputBg = darkMode
    ? 'bg-black/40 border-white/15 text-white placeholder:text-slate-500 focus:border-cyan-400'
    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-purple-500';

  const quotaPercent = Math.min(100, Math.round((currentUser.usedQuota / currentUser.dailyQuota) * 100));

  // ============================================================================
  // RENDER KONTEN UTAMA BERDASARKAN TAB AKTIF
  // ============================================================================
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/80 via-[#101022] to-cyan-950/70 p-6 md:p-8 text-white">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 border border-cyan-400/30 px-3 py-1 text-xs font-medium text-cyan-300">
                  <Sparkles className="w-3.5 h-3.5" /> 100% Gratis • Open-Source Ready • Tanpa Langganan Wajib
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                  Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300">ATY AI STUDIO</span>
                </h1>
                <p className="text-sm md:text-base text-slate-300">
                  Platform kecerdasan buatan pribadi serba ada untuk chat cerdas, generator gambar, video sinematik, suara, penulisan kreatif, dan terjemahan multi-bahasa.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 font-semibold text-sm hover:brightness-110 transition flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Mulai AI Chat
                  </button>
                  <button
                    onClick={() => setActiveTab('image')}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 font-semibold text-sm transition flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4 text-cyan-300" /> Buat Gambar AI
                  </button>
                  <button
                    onClick={() => {
                      setGoogleStepOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 font-semibold text-sm transition flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4 text-purple-300" /> Masuk dengan Google
                  </button>
                </div>
              </div>
            </div>

            {/* Statistik Kuota Gratis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`rounded-2xl border p-4 ${cardBg}`}>
                <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                  <span>Kuota Gratis Harian</span>
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold">{currentUser.usedQuota} / {currentUser.dailyQuota}</div>
                <div className="w-full h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400" style={{ width: `${quotaPercent}%` }} />
                </div>
                <p className="text-[11px] opacity-60 mt-1.5">Reset otomatis setiap hari • Mendukung BYOK tanpa batas lokal</p>
              </div>
              <div className={`rounded-2xl border p-4 ${cardBg}`}>
                <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                  <span>Model Aktif</span>
                  <Cpu className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-lg font-bold truncate">{AI_MODELS.find((m) => m.id === aiSettings.model)?.name}</div>
                <p className="text-xs text-cyan-400 mt-1">Mode: {aiSettings.reasoningMode ? 'Penalaran Mendalam' : 'Mode Cepat'}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${cardBg}`}>
                <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                  <span>Karya Tersimpan</span>
                  <Folder className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold">{gallery.length} Proyek</div>
                <button onClick={() => setActiveTab('gallery')} className="text-xs text-cyan-400 hover:underline mt-1">
                  Buka Galeri →
                </button>
              </div>
            </div>

            {/* Grid 10 Fitur Utama */}
            <div>
              <h2 className="text-lg font-bold mb-3">10 Studio AI Utama</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { id: 'chat', title: 'AI Chat', desc: 'Chatbot pintar & penalaran', icon: MessageSquare, color: 'from-purple-500 to-indigo-500' },
                  { id: 'image', title: 'AI Image', desc: 'Teks menjadi gambar HD', icon: ImageIcon, color: 'from-cyan-500 to-blue-500' },
                  { id: 'img2img', title: 'Image to Image', desc: 'Ubah gaya foto Anda', icon: Wand2, color: 'from-fuchsia-500 to-purple-600' },
                  { id: 'video', title: 'AI Video', desc: 'Teks ke video sinematik', icon: Video, color: 'from-blue-500 to-cyan-400' },
                  { id: 'img2vid', title: 'Image to Video', desc: 'Hidupkan foto bergerak', icon: Film, color: 'from-violet-500 to-cyan-500' },
                  { id: 'tts', title: 'Text to Speech', desc: 'Ubah teks jadi suara', icon: Volume2, color: 'from-emerald-500 to-cyan-500' },
                  { id: 'stt', title: 'Speech to Text', desc: 'Rekam suara jadi teks', icon: Mic, color: 'from-rose-500 to-purple-500' },
                  { id: 'writer', title: 'AI Writer', desc: 'Artikel, cerita & lirik', icon: PenTool, color: 'from-amber-500 to-orange-500' },
                  { id: 'translator', title: 'AI Translator', desc: 'Penerjemah multi-bahasa', icon: Languages, color: 'from-sky-500 to-indigo-500' },
                  { id: 'assistant', title: 'AI Assistant', desc: 'Asisten produktivitas', icon: Bot, color: 'from-purple-600 to-cyan-400' }
                ].map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTab(tool.id)}
                      className={`text-left rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/60 ${cardBg}`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white mb-3`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm">{tool.title}</h3>
                      <p className="text-xs opacity-65 mt-0.5">{tool.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-8.5rem)] min-h-[540px]">
            {/* Daftar Riwayat Percakapan */}
            <div className={`lg:col-span-3 rounded-2xl border p-3 flex flex-col ${cardBg}`}>
              <button
                onClick={createNewConversation}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition mb-3"
              >
                <Plus className="w-4 h-4" /> Percakapan Baru
              </button>
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition ${
                      conv.id === activeConversation.id
                        ? 'bg-purple-600/25 border border-purple-500/40 font-semibold'
                        : 'hover:bg-white/5 opacity-80'
                    }`}
                  >
                    <span className="truncate pr-2">{conv.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="opacity-50 hover:opacity-100 hover:text-rose-400"
                      title="Hapus percakapan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Area Obrolan Utama */}
            <div className={`lg:col-span-9 rounded-2xl border flex flex-col overflow-hidden ${cardBg}`}>
              {/* Header Chat + Pengaturan AI */}
              <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-sm">{AI_MODELS.find((m) => m.id === aiSettings.model)?.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    {aiSettings.reasoningMode ? 'Mode Penalaran' : 'Mode Cepat'}
                  </span>
                </div>
                <button
                  onClick={() => setShowAiSettingsPanel((p) => !p)}
                  className="px-3 py-1.5 rounded-lg border border-white/15 hover:border-cyan-400 text-xs flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Pengaturan AI
                </button>
              </div>

              {/* Panel Pengaturan AI Lengkap (Collapsible) */}
              {showAiSettingsPanel && (
                <div className="p-4 border-b border-white/10 bg-black/20 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="opacity-70 block mb-1">Model AI Gratis</label>
                    <select
                      value={aiSettings.model}
                      onChange={(e) => setAiSettings((p) => ({ ...p, model: e.target.value }))}
                      className={`w-full rounded-lg border px-2.5 py-2 ${inputBg}`}
                    >
                      {AI_MODELS.map((m) => (
                        <option key={m.id} value={m.id} className="text-slate-900">
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="opacity-70 block mb-1">Kreativitas & Temperature ({aiSettings.temperature})</label>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.1"
                      value={aiSettings.temperature}
                      onChange={(e) => setAiSettings((p) => ({ ...p, temperature: Number(e.target.value) }))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="opacity-70 block mb-1">Max Output Tokens ({aiSettings.maxTokens})</label>
                    <input
                      type="number"
                      min="128"
                      max="4096"
                      step="128"
                      value={aiSettings.maxTokens}
                      onChange={(e) => setAiSettings((p) => ({ ...p, maxTokens: Number(e.target.value) }))}
                      className={`w-full rounded-lg border px-2.5 py-1.5 ${inputBg}`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="opacity-70 block mb-1">System Prompt</label>
                    <input
                      type="text"
                      value={aiSettings.systemPrompt}
                      onChange={(e) => setAiSettings((p) => ({ ...p, systemPrompt: e.target.value }))}
                      className={`w-full rounded-lg border px-2.5 py-1.5 ${inputBg}`}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setAiSettings((p) => ({ ...p, reasoningMode: !p.reasoningMode }))}
                      className={`w-full py-2 px-3 rounded-lg border font-semibold transition ${
                        aiSettings.reasoningMode
                          ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                          : 'border-white/15 opacity-80'
                      }`}
                    >
                      {aiSettings.reasoningMode ? '✓ Mode Penalaran Aktif' : '⚡ Mode Cepat Aktif'}
                    </button>
                  </div>
                </div>
              )}

              {/* Daftar Pesan */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeConversation.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                          : msg.isError
                          ? 'bg-rose-500/15 border border-rose-500/40 text-rose-200'
                          : darkMode
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {msg.attachment && (
                        <div className="mb-2 text-xs opacity-90 flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-lg">
                          <FileText className="w-3.5 h-3.5" /> {msg.attachment.name}
                        </div>
                      )}
                      {msg.text}
                      {msg.role === 'assistant' && !msg.isError && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10 text-[11px] opacity-70">
                          <button onClick={() => copyText(msg.text)} className="hover:text-cyan-400 flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Salin
                          </button>
                          <button
                            onClick={() => saveToGallery({ type: 'text', title: activeConversation.title, content: msg.text })}
                            className="hover:text-cyan-400 flex items-center gap-1"
                          >
                            <Bookmark className="w-3 h-3" /> Simpan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> ATY AI sedang menyusun jawaban...
                  </div>
                )}
              </div>

              {/* Input Pesan + Upload Dokumen/Gambar */}
              <div className="p-3 border-t border-white/10 space-y-2">
                {chatAttachment && (
                  <div className="flex items-center justify-between text-xs bg-cyan-500/15 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
                    <span className="truncate">Lampiran: {chatAttachment.name}</span>
                    <button onClick={() => setChatAttachment(null)}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label className="p-2.5 rounded-xl border border-white/15 hover:border-cyan-400 cursor-pointer shrink-0" title="Unggah gambar atau dokumen">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <input type="file" className="hidden" accept="image/*,.txt,.md,.json,.csv" onChange={handleChatFile} />
                  </label>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Tulis pertanyaan atau perintah untuk ATY AI..."
                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none ${inputBg}`}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold text-sm hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-4 h-4" /> <span className="hidden sm:inline">Kirim</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'image':
      case 'img2img': {
        const isImg2Img = activeTab === 'img2img';
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Panel Pengaturan Generator Gambar */}
            <div className={`lg:col-span-5 rounded-2xl border p-5 space-y-4 ${cardBg}`}>
              <div className="flex items-center gap-2">
                {isImg2Img ? <Wand2 className="w-5 h-5 text-cyan-400" /> : <ImageIcon className="w-5 h-5 text-purple-400" />}
                <h2 className="font-bold text-lg">{isImg2Img ? 'Image to Image Studio' : 'AI Image Generator'}</h2>
              </div>

              {isImg2Img && (
                <div>
                  <label className="text-xs opacity-70 block mb-1.5">Unggah Gambar Referensi (Wajib)</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/15 hover:border-cyan-400 rounded-xl p-4 cursor-pointer transition">
                    {imgRefPreview ? (
                      <img src={imgRefPreview} alt="Referensi" className="max-h-40 rounded-lg object-contain" />
                    ) : (
                      <div className="text-center text-xs opacity-70 space-y-1">
                        <Upload className="w-6 h-6 mx-auto text-cyan-400" />
                        <p>Klik untuk pilih foto dari HP/Komputer</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageRefUpload} />
                  </label>
                </div>
              )}

              <div>
                <label className="text-xs opacity-70 block mb-1">{isImg2Img ? 'Instruksi Perubahan Gambar' : 'Prompt Gambar'}</label>
                <textarea
                  rows={3}
                  value={imgPrompt}
                  onChange={(e) => setImgPrompt(e.target.value)}
                  className={`w-full rounded-xl border p-3 text-sm outline-none ${inputBg}`}
                  placeholder="Deskripsikan gambar yang ingin dibuat..."
                />
              </div>

              <div>
                <label className="text-xs opacity-70 block mb-1">Negative Prompt</label>
                <input
                  type="text"
                  value={imgNegPrompt}
                  onChange={(e) => setImgNegPrompt(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs opacity-70 block mb-1">Rasio Aspek</label>
                  <select value={imgRatio} onChange={(e) => setImgRatio(e.target.value)} className={`w-full rounded-xl border px-3 py-2 text-xs ${inputBg}`}>
                    {Object.entries(ASPECT_RATIOS).map(([k, v]) => (
                      <option key={k} value={k} className="text-slate-900">{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs opacity-70 block mb-1">Gaya Visual</label>
                  <select value={imgStyle} onChange={(e) => setImgStyle(e.target.value)} className={`w-full rounded-xl border px-3 py-2 text-xs ${inputBg}`}>
                    {IMAGE_STYLES.map((s) => (
                      <option key={s.id} value={s.id} className="text-slate-900">{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs opacity-70 block mb-1">Resolusi</label>
                  <select value={imgResolution} onChange={(e) => setImgResolution(e.target.value)} className={`w-full rounded-xl border px-3 py-2 text-xs ${inputBg}`}>
                    <option value="HD" className="text-slate-900">HD (Cepat)</option>
                    <option value="Ultra HD" className="text-slate-900">Ultra HD (Tajam)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs opacity-70 block mb-1">Jumlah Gambar</label>
                  <select value={imgCount} onChange={(e) => setImgCount(Number(e.target.value))} disabled={isImg2Img} className={`w-full rounded-xl border px-3 py-2 text-xs ${inputBg}`}>
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n} className="text-slate-900">{n} Gambar</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs opacity-70 block mb-1">Seed</label>
                  <input
                    type="text"
                    value={imgSeed}
                    onChange={(e) => setImgSeed(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs ${inputBg}`}
                  />
                </div>
                {!isImg2Img && (
                  <div>
                    <label className="text-xs opacity-70 block mb-1">Image Reference (Opsional)</label>
                    <label className={`w-full rounded-xl border px-3 py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer ${inputBg}`}>
                      <Upload className="w-3.5 h-3.5 text-cyan-400" /> {imgRefPreview ? 'Foto Terpilih' : 'Unggah'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageRefUpload} />
                    </label>
                  </div>
                )}
              </div>

              <button
                onClick={() => generateImages(isImg2Img)}
                disabled={imgLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm hover:brightness-110 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> {imgLoading ? 'Sedang Membuat...' : 'Generate Gambar'}
              </button>
            </div>

            {/* Galeri Hasil Gambar */}
            <div className={`lg:col-span-7 rounded-2xl border p-5 ${cardBg}`}>
              <h3 className="font-bold text-sm mb-4">Hasil Generasi Gambar</h3>
              {generatedImages.length === 0 ? (
                <div className="h-72 flex flex-col items-center justify-center text-center opacity-50 border border-dashed border-white/15 rounded-xl p-6">
                  <ImageIcon className="w-10 h-10 mb-2 text-purple-400" />
                  <p className="text-sm">Belum ada gambar. Atur prompt dan klik tombol <b>Generate Gambar</b>.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {generatedImages.map((item) => (
                    <div key={item.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                      <img
                        src={item.url}
                        alt={item.prompt}
                        onError={(e) => {
                          e.currentTarget.src = item.fallbackUrl;
                        }}
                        className="w-full h-64 object-cover"
                      />
                      <div className="p-3 flex items-center justify-between gap-2 text-xs">
                        <span className="opacity-70 truncate">{item.style} • {item.ratio}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => saveToGallery({ type: 'image', title: item.prompt.slice(0, 32), content: item.url })}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-purple-500/30"
                            title="Simpan ke Galeri"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={item.url}
                            download={`aty-image-${item.seed}.png`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                            title="Unduh Gambar"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'video':
      case 'img2vid': {
        const isImg2Vid = activeTab === 'img2vid';
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-5 rounded-2xl border p-5 space-y-3.5 ${cardBg}`}>
              <div className="flex items-center gap-2">
                {isImg2Vid ? <Film className="w-5 h-5 text-cyan-400" /> : <Video className="w-5 h-5 text-purple-400" />}
                <h2 className="font-bold text-lg">{isImg2Vid ? 'Image to Video' : 'AI Video Generator'}</h2>
              </div>

              {isImg2Vid && (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/15 hover:border-cyan-400 rounded-xl p-4 cursor-pointer">
                  {vidSourceImage ? (
                    <img src={vidSourceImage} alt="Sumber Video" className="max-h-36 rounded-lg object-contain" />
                  ) : (
                    <div className="text-center text-xs opacity-70">
                      <Upload className="w-6 h-6 mx-auto mb-1 text-cyan-400" />
                      Unggah foto untuk diubah menjadi video bergerak
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleVideoImageUpload} />
                </label>
              )}

              <div>
                <label className="text-xs opacity-70 block mb-1">Prompt Adegan Video</label>
                <textarea
                  rows={2}
                  value={vidPrompt}
                  onChange={(e) => setVidPrompt(e.target.value)}
                  className={`w-full rounded-xl border p-3 text-sm ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="opacity-70 block mb-1">Durasi ({vidConfig.duration} detik)</label>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={vidConfig.duration}
                    onChange={(e) => setVidConfig((p) => ({ ...p, duration: Number(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <label className="opacity-70 block mb-1">Resolusi</label>
                  <select value={vidConfig.resolution} onChange={(e) => setVidConfig((p) => ({ ...p, resolution: e.target.value }))} className={`w-full rounded-lg border px-2.5 py-2 ${inputBg}`}>
                    <option value="720p" className="text-slate-900">720p HD</option>
                    <option value="1080p" className="text-slate-900">1080p Full HD</option>
                    <option value="4K" className="text-slate-900">4K Ultra HD</option>
                  </select>
                </div>
                <div>
                  <label className="opacity-70 block mb-1">Rasio Video</label>
                  <select value={vidConfig.ratio} onChange={(e) => setVidConfig((p) => ({ ...p, ratio: e.target.value }))} className={`w-full rounded-lg border px-2.5 py-2 ${inputBg}`}>
                    <option value="16:9" className="text-slate-900">16:9 (YouTube)</option>
                    <option value="9:16" className="text-slate-900">9:16 (Reels/TikTok)</option>
                    <option value="1:1" className="text-slate-900">1:1 (Persegi)</option>
                  </select>
                </div>
                <div>
                  <label className="opacity-70 block mb-1">Frame Rate</label>
                  <select value={vidConfig.fps} onChange={(e) => setVidConfig((p) => ({ ...p, fps: Number(e.target.value) }))} className={`w-full rounded-lg border px-2.5 py-2 ${inputBg}`}>
                    <option value={24} className="text-slate-900">24 FPS (Film)</option>
                    <option value={30} className="text-slate-900">30 FPS (Standar)</option>
                    <option value={60} className="text-slate-900">60 FPS (Halus)</option>
                  </select>
                </div>
                <div>
                  <label className="opacity-70 block mb-1">Gerakan Kamera</label>
                  <select value={vidConfig.cameraMotion} onChange={(e) => setVidConfig((p) => ({ ...p, cameraMotion: e.target.value }))} className={`w-full rounded-lg border px-2.5 py-2 ${inputBg}`}>
                    <option value="Zoom In Sinematik" className="text-slate-900">Zoom In Sinematik</option>
                    <option value="Zoom Out Dramatis" className="text-slate-900">Zoom Out Dramatis</option>
                    <option value="Pan Kanan" className="text-slate-900">Pan Kanan</option>
                    <option value="Pan Kiri" className="text-slate-900">Pan Kiri</option>
                  </select>
                </div>
                <div>
                  <label className="opacity-70 block mb-1">Gerakan Objek</label>
                  <select value={vidConfig.objectMotion} onChange={(e) => setVidConfig((p) => ({ ...p, objectMotion: e.target.value }))} className={`w-full rounded-lg border px-2.5 py-2 ${inputBg}`}>
                    <option value="Halus" className="text-slate-900">Halus</option>
                    <option value="Sedang" className="text-slate-900">Sedang</option>
                    <option value="Cepat" className="text-slate-900">Cepat</option>
                  </select>
                </div>
                <div>
                  <label className="opacity-70 block mb-1">Musik Latar</label>
                  <select value={vidConfig.bgMusic} onChange={(e) => setVidConfig((p) => ({ ...p, bgMusic: e.target.value }))} className={`w-full rounded-lg border px-2.5 py-2 ${inputBg}`}>
                    <option value="Synthwave Ambient" className="text-slate-900">Synthwave Ambient</option>
                    <option value="Cinematic Epic" className="text-slate-900">Cinematic Epic</option>
                    <option value="Tanpa Musik" className="text-slate-900">Tanpa Musik</option>
                  </select>
                </div>
                <div>
                  <label className="opacity-70 block mb-1">Efek Suara (SFX)</label>
                  <select value={vidConfig.sfx} onChange={(e) => setVidConfig((p) => ({ ...p, sfx: e.target.value }))} className={`w-full rounded-lg border px-2.5 py-2 ${inputBg}`}>
                    <option value="Sci-Fi Wind" className="text-slate-900">Sci-Fi Wind</option>
                    <option value="Alam & Hujan" className="text-slate-900">Alam & Hujan</option>
                    <option value="Mati" className="text-slate-900">Mati</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vidConfig.characterConsistency}
                    onChange={(e) => setVidConfig((p) => ({ ...p, characterConsistency: e.target.checked }))}
                    className="accent-cyan-400"
                  />
                  Konsistensi Karakter
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vidConfig.audioSync}
                    onChange={(e) => setVidConfig((p) => ({ ...p, audioSync: e.target.checked }))}
                    className="accent-cyan-400"
                  />
                  Sinkronisasi Audio
                </label>
              </div>

              <div>
                <label className="text-xs opacity-70 block mb-1">Negative Prompt</label>
                <input type="text" value={vidNegPrompt} onChange={(e) => setVidNegPrompt(e.target.value)} className={`w-full rounded-lg border px-3 py-1.5 text-xs ${inputBg}`} />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={startVideoPreview}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm hover:brightness-110 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> Generate & Putar
                </button>
                <button
                  onClick={exportVideoWebm}
                  disabled={vidExporting}
                  className="px-4 py-2.5 rounded-xl border border-cyan-400/50 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/15 disabled:opacity-50"
                >
                  {vidExporting ? 'Merekam...' : 'Ekspor .WEBM'}
                </button>
              </div>
            </div>

            {/* Viewport Preview Video */}
            <div className={`lg:col-span-7 rounded-2xl border p-5 flex flex-col justify-between ${cardBg}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Layar Pratinjau Video</h3>
                {vidPlaying && (
                  <button onClick={() => setVidPlaying(false)} className="text-xs text-rose-400 flex items-center gap-1">
                    <Square className="w-3.5 h-3.5" /> Hentikan
                  </button>
                )}
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center min-h-[320px]">
                <canvas
                  ref={videoCanvasRef}
                  width={vidConfig.ratio === '9:16' ? 360 : vidConfig.ratio === '1:1' ? 480 : 640}
                  height={vidConfig.ratio === '9:16' ? 640 : vidConfig.ratio === '1:1' ? 480 : 360}
                  className="max-w-full max-h-[420px] rounded-lg"
                />
              </div>
              {vidDownloadUrl && (
                <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs">
                  <span className="text-emerald-300 font-semibold">Video siap diunduh!</span>
                  <a href={vidDownloadUrl} download="aty-ai-video.webm" className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Unduh .WEBM
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'tts':
        return (
          <div className={`max-w-3xl mx-auto rounded-2xl border p-6 space-y-5 ${cardBg}`}>
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold text-lg">Text to Speech (Suara AI Gratis)</h2>
            </div>
            <textarea
              rows={5}
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              className={`w-full rounded-xl border p-4 text-sm ${inputBg}`}
              placeholder="Ketik teks yang ingin diubah menjadi suara..."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="opacity-70 block mb-1">Kecepatan Suara ({ttsRate}x)</label>
                <input type="range" min="0.5" max="2" step="0.1" value={ttsRate} onChange={(e) => setTtsRate(Number(e.target.value))} className="w-full accent-cyan-400" />
              </div>
              <div>
                <label className="opacity-70 block mb-1">Nada / Pitch ({ttsPitch})</label>
                <input type="range" min="0.5" max="2" step="0.1" value={ttsPitch} onChange={(e) => setTtsPitch(Number(e.target.value))} className="w-full accent-purple-500" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSpeakTTS}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold text-sm flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> {ttsSpeaking ? 'Sedang Berbicara...' : 'Putar Suara'}
              </button>
              {ttsSpeaking && (
                <button onClick={stopTTS} className="px-4 py-2.5 rounded-xl border border-rose-500/40 text-rose-400 text-sm flex items-center gap-2">
                  <Square className="w-4 h-4" /> Berhenti
                </button>
              )}
              {ttsWavUrl && (
                <a href={ttsWavUrl} download="aty-speech.wav" className="px-4 py-2.5 rounded-xl border border-cyan-400/40 text-cyan-300 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" /> Unduh Audio .WAV
                </a>
              )}
            </div>
          </div>
        );

      case 'stt':
        return (
          <div className={`max-w-3xl mx-auto rounded-2xl border p-6 space-y-5 ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-purple-400" />
                <h2 className="font-bold text-lg">Speech to Text (Transkripsi Suara)</h2>
              </div>
              <button
                onClick={toggleSTT}
                className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition ${
                  sttListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                }`}
              >
                <Mic className="w-4 h-4" /> {sttListening ? 'Hentikan Rekam' : 'Mulai Rekam Suara'}
              </button>
            </div>
            <textarea
              rows={7}
              value={sttTranscript}
              onChange={(e) => setSttTranscript(e.target.value)}
              placeholder="Hasil transkripsi suara Anda akan muncul secara otomatis di sini..."
              className={`w-full rounded-xl border p-4 text-sm ${inputBg}`}
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => copyText(sttTranscript)} className="px-4 py-2 rounded-xl border border-white/15 text-xs flex items-center gap-1.5 hover:border-cyan-400">
                <Copy className="w-3.5 h-3.5" /> Salin Transkrip
              </button>
              <button
                onClick={() => sttTranscript && saveToGallery({ type: 'text', title: 'Transkrip Suara', content: sttTranscript })}
                className="px-4 py-2 rounded-xl border border-white/15 text-xs flex items-center gap-1.5 hover:border-cyan-400"
              >
                <Bookmark className="w-3.5 h-3.5" /> Simpan ke Proyek
              </button>
              <button onClick={() => setSttTranscript('')} className="px-4 py-2 rounded-xl border border-rose-500/30 text-rose-400 text-xs">
                Bersihkan
              </button>
            </div>
          </div>
        );

      case 'writer':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-5 rounded-2xl border p-5 space-y-4 ${cardBg}`}>
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-lg">AI Writer Studio</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="opacity-70 block mb-1">Jenis Karya</label>
                  <select value={writerType} onChange={(e) => setWriterType(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${inputBg}`}>
                    {['Artikel', 'Cerita Pendek', 'Puisi', 'Lirik Lagu', 'Naskah Video / Film'].map((t) => (
                      <option key={t} value={t} className="text-slate-900">{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="opacity-70 block mb-1">Gaya Bahasa</label>
                  <select value={writerTone} onChange={(e) => setWriterTone(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${inputBg}`}>
                    {['Profesional', 'Puitis', 'Santai & Kreatif', 'Dramatis', 'Persuasif'].map((t) => (
                      <option key={t} value={t} className="text-slate-900">{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs opacity-70 block mb-1">Topik / Ide Utama</label>
                <textarea
                  rows={4}
                  value={writerTopic}
                  onChange={(e) => setWriterTopic(e.target.value)}
                  placeholder="Contoh: Cerita pendek tentang robot yang belajar melukis di kota Yogyakarta..."
                  className={`w-full rounded-xl border p-3 text-sm ${inputBg}`}
                />
              </div>
              <button
                onClick={runWriter}
                disabled={writerLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm hover:brightness-110 disabled:opacity-50"
              >
                {writerLoading ? 'Sedang Menulis...' : `Generate ${writerType}`}
              </button>
            </div>
            <div className={`lg:col-span-7 rounded-2xl border p-5 flex flex-col ${cardBg}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Hasil Tulisan</h3>
                {writerResult && (
                  <div className="flex gap-2">
                    <button onClick={() => copyText(writerResult)} className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:text-cyan-400 flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" /> Salin
                    </button>
                    <button onClick={() => saveToGallery({ type: 'text', title: `${writerType}: ${writerTopic.slice(0, 24)}`, content: writerResult })} className="text-xs px-3 py-1 rounded-lg bg-purple-600/30 text-purple-200 flex items-center gap-1">
                      <Bookmark className="w-3.5 h-3.5" /> Simpan
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 rounded-xl border border-white/10 bg-black/20 p-4 text-sm whitespace-pre-wrap leading-relaxed min-h-[280px]">
                {writerResult || <span className="opacity-45">Hasil tulisan AI akan tampil di sini...</span>}
              </div>
            </div>
          </div>
        );

      case 'translator':
        return (
          <div className={`max-w-4xl mx-auto rounded-2xl border p-6 space-y-4 ${cardBg}`}>
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold text-lg">AI Translator Multi-Bahasa</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
              <select value={transSourceLang} onChange={(e) => setTransSourceLang(e.target.value)} className={`sm:col-span-5 rounded-xl border px-3 py-2.5 text-sm ${inputBg}`}>
                {LANGUAGES_LIST.map((l) => (
                  <option key={l} value={l} className="text-slate-900">{l}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const temp = transSourceLang;
                  setTransSourceLang(transTargetLang);
                  setTransTargetLang(temp);
                }}
                className="sm:col-span-1 py-2 rounded-xl border border-white/15 hover:border-cyan-400 flex items-center justify-center"
                title="Tukar Bahasa"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
              </button>
              <select value={transTargetLang} onChange={(e) => setTransTargetLang(e.target.value)} className={`sm:col-span-5 rounded-xl border px-3 py-2.5 text-sm ${inputBg}`}>
                {LANGUAGES_LIST.map((l) => (
                  <option key={l} value={l} className="text-slate-900">{l}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                rows={6}
                value={transInput}
                onChange={(e) => setTransInput(e.target.value)}
                placeholder="Masukkan teks sumber..."
                className={`w-full rounded-xl border p-4 text-sm ${inputBg}`}
              />
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm whitespace-pre-wrap relative min-h-[150px]">
                {transOutput || <span className="opacity-45">Hasil terjemahan akan muncul di sini...</span>}
                {transOutput && (
                  <button onClick={() => copyText(transOutput)} className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white/10 text-xs flex items-center gap-1 hover:text-cyan-400">
                    <Copy className="w-3 h-3" /> Salin
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={runTranslator}
              disabled={transLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm"
            >
              {transLoading ? 'Menerjemahkan...' : 'Terjemahkan Sekarang'}
            </button>
          </div>
        );

      case 'assistant':
        return (
          <div className={`max-w-4xl mx-auto rounded-2xl border p-6 space-y-4 ${cardBg}`}>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              <h2 className="font-bold text-lg">AI Assistant Pribadi</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Ringkasan & Poin Penting', 'Email Profesional', 'Rencana & Jadwal Kerja', 'Ide Bisnis & Konten', 'Review & Perbaikan Kode'].map((t) => (
                <button
                  key={t}
                  onClick={() => setAssistTask(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                    assistTask === t ? 'bg-purple-600/30 border-purple-400 text-white' : 'border-white/15 opacity-75 hover:opacity-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea
              rows={4}
              value={assistInput}
              onChange={(e) => setAssistInput(e.target.value)}
              placeholder={`Tuliskan detail untuk "${assistTask}"...`}
              className={`w-full rounded-xl border p-4 text-sm ${inputBg}`}
            />
            <button
              onClick={runAssistant}
              disabled={assistLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm"
            >
              {assistLoading ? 'Memproses Tugas...' : 'Jalankan Asisten'}
            </button>
            {assistOutput && (
              <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm whitespace-pre-wrap space-y-3">
                <div>{assistOutput}</div>
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button onClick={() => copyText(assistOutput)} className="text-xs px-3 py-1 rounded-lg bg-white/10 flex items-center gap-1">
                    <Copy className="w-3.5 h-3.5" /> Salin
                  </button>
                  <button onClick={() => saveToGallery({ type: 'text', title: assistTask, content: assistOutput })} className="text-xs px-3 py-1 rounded-lg bg-purple-600/30 flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5" /> Simpan
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Folder className="w-5 h-5 text-cyan-400" /> Galeri Karya & Penyimpanan Proyek
              </h2>
              <span className="text-xs opacity-70">{gallery.length} item tersimpan</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.map((item) => (
                <div key={item.id} className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 ${cardBg}`}>
                  <div>
                    <div className="flex items-center justify-between text-xs opacity-60 mb-2">
                      <span className="uppercase font-semibold text-cyan-400">{item.type}</span>
                      <span>{item.createdAt}</span>
                    </div>
                    <h3 className="font-bold text-sm mb-2">{item.title}</h3>
                    {item.type === 'image' ? (
                      <img src={item.content} alt={item.title} className="w-full h-40 object-cover rounded-xl" />
                    ) : (
                      <p className="text-xs opacity-80 line-clamp-4 whitespace-pre-wrap">{item.content}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <button onClick={() => copyText(item.content)} className="text-cyan-400 hover:underline flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" /> Salin
                    </button>
                    <button
                      onClick={() => setGallery((prev) => prev.filter((g) => g.id !== item.id))}
                      className="text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Kartu Profil Pengguna */}
            <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBg}`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{currentUser.name}</h2>
                  <p className="text-xs opacity-70">{currentUser.email}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">{currentUser.plan}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">{currentUser.role}</span>
                    {currentUser.provider === 'google' && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                        Terhubung ke Google
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setGoogleStepOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl border border-white/15 hover:border-cyan-400 text-xs font-semibold flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-cyan-400" /> Ganti Akun / Login
                </button>
                {currentUser.provider !== 'guest' && (
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                )}
              </div>
            </div>

            {/* Pengaturan API Key Pribadi (BYOK) */}
            <div className={`rounded-2xl border p-6 space-y-3 ${cardBg}`}>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base">API Key Pribadi (Opsional / BYOK)</h3>
              </div>
              <p className="text-xs opacity-75">
                ATY AI STUDIO sudah dapat digunakan secara gratis tanpa API key. Namun jika Anda memiliki API Key gratis dari Google Gemini (<code>AIza...</code>), Groq (<code>gsk_...</code>), atau OpenAI (<code>sk-...</code>), Anda dapat memasukkannya di sini. Untuk produksi, simpan API key di environment variables backend.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Masukkan API Key opsional (AIza... / gsk_... / sk-...)"
                    className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm ${inputBg}`}
                  />
                  <button onClick={() => setShowApiKey((p) => !p)} className="absolute right-3 top-2.5 opacity-60 hover:opacity-100">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => notify(customApiKey ? 'API Key pribadi diaktifkan untuk sesi ini.' : 'Menggunakan API gratis bawaan.', 'success')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-semibold"
                >
                  Terapkan
                </button>
              </div>
            </div>

            {/* Pengaturan Bahasa & Tampilan */}
            <div className={`rounded-2xl border p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 ${cardBg}`}>
              <div>
                <label className="text-xs opacity-70 block mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" /> Bahasa Antarmuka
                </label>
                <select value={uiLang} onChange={(e) => setUiLang(e.target.value)} className={`w-full rounded-xl border px-3 py-2 text-sm ${inputBg}`}>
                  <option value="id" className="text-slate-900">Bahasa Indonesia</option>
                  <option value="en" className="text-slate-900">English</option>
                </select>
              </div>
              <div>
                <label className="text-xs opacity-70 block mb-1.5">Tema Aplikasi</label>
                <button
                  onClick={() => setDarkMode((p) => !p)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm flex items-center justify-center gap-2 ${inputBg}`}
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-500" />}
                  {darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" /> Dashboard Administrator ATY AI STUDIO
              </h2>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Status Sistem: Stabil & Gratis
              </span>
            </div>

            {/* Grafik Statistik Penggunaan */}
            <div className={`rounded-2xl border p-5 ${cardBg}`}>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" /> Statistik Penggunaan Mingguan
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={USAGE_CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="chat" stroke="#a855f7" fill="#a855f7" fillOpacity={0.25} name="AI Chat" />
                    <Area type="monotone" dataKey="image" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} name="AI Image" />
                    <Area type="monotone" dataKey="video" stroke="#10b981" fill="#10b981" fillOpacity={0.25} name="AI Video" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Manajemen Pengguna */}
              <div className={`rounded-2xl border p-5 space-y-3 ${cardBg}`}>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" /> Manajemen Pengguna & Kuota
                </h3>
                <div className="space-y-2 text-xs">
                  {adminUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                      <div>
                        <p className="font-semibold">{u.name} <span className="opacity-60">({u.role})</span></p>
                        <p className="opacity-60">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">{u.quota}</span>
                        <button
                          onClick={() =>
                            setAdminUsers((prev) =>
                              prev.map((item) => (item.id === u.id ? { ...item, status: item.status === 'Aktif' ? 'Ditangguhkan' : 'Aktif' } : item))
                            )
                          }
                          className="px-2 py-1 rounded border border-white/15 hover:border-cyan-400"
                        >
                          {u.status}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pengaturan Fitur Langsung */}
              <div className={`rounded-2xl border p-5 space-y-3 ${cardBg}`}>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" /> Kontrol Fitur & Keamanan
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(adminFeatures).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setAdminFeatures((p) => ({ ...p, [key]: !p[key] }))}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border transition ${
                        val ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-white/10 opacity-50'
                      }`}
                    >
                      <span className="capitalize">{key}</span>
                      <span>{val ? 'Aktif' : 'Nonaktif'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Monitoring Error & Panduan Deployment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`rounded-2xl border p-5 space-y-3 ${cardBg}`}>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" /> Monitoring Error API
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
                  {errorLogs.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-lg bg-black/25 border border-white/5 flex items-start gap-2">
                      <span className="opacity-50 shrink-0">{log.time}</span>
                      <span className="font-semibold text-cyan-400 shrink-0">[{log.module}]</span>
                      <span className="opacity-85">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl border p-5 space-y-3 ${cardBg}`}>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" /> Panduan Instalasi & Deployment Gratis
                </h3>
                <pre className="text-[11px] bg-black/40 border border-white/10 rounded-xl p-3 overflow-x-auto text-cyan-300 leading-relaxed">
{`# 1. Buat proyek React / Next.js + Tailwind CSS
npm create vite@latest aty-ai-studio -- --template react
cd aty-ai-studio && npm install lucide-react recharts

# 2. Simpan API Key di .env (Backend / Vercel Env)
SUPABASE_URL=https://proyek-anda.supabase.co
SUPABASE_ANON_KEY=kunci_publik_supabase
GEMINI_API_KEY=kunci_rahasia_di_server

# 3. Deploy Gratis ke Vercel
npx vercel --prod`}
                </pre>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // LAYOUT UTAMA APLIKASI (SIDEBAR + HEADER + KONTEN + MODAL AUTH GOOGLE)
  // ============================================================================
  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors ${appBg}`}>
      {/* Toast Notifikasi */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-white/15 bg-[#121224] text-white px-4 py-3 shadow-2xl flex items-center gap-2.5 text-xs">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 border-r flex flex-col transition-transform duration-200 ${sidebarBg} ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-400 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-purple-500/20">
              ATY
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wide">ATY AI STUDIO</div>
              <div className="text-[10px] text-cyan-400 font-medium">Free Personal AI</div>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-1 opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems
            .filter((item) => item.enabled !== false)
            .map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                    active
                      ? 'bg-gradient-to-r from-purple-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'opacity-75 hover:opacity-100 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="rounded-xl bg-black/25 border border-white/10 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="opacity-70">Kuota Gratis</span>
              <span className="font-bold text-cyan-400">{currentUser.usedQuota}/{currentUser.dailyQuota}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400" style={{ width: `${quotaPercent}%` }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay Mobile Menu */}
      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-30 bg-black/60 md:hidden" />}

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className={`sticky top-0 z-20 border-b backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3 ${darkMode ? 'bg-[#07070d]/85 border-white/10' : 'bg-white/85 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-xl border border-white/15">
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm md:text-base truncate">
              {navItems.find((n) => n.id === activeTab)?.label || 'ATY AI STUDIO'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode((p) => !p)}
              className="p-2 rounded-xl border border-white/15 hover:border-cyan-400 transition"
              title="Ganti Tema"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
            </button>
            <button
              onClick={() => {
                setGoogleStepOpen(false);
                setAuthModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/15 hover:border-cyan-400 transition text-xs font-semibold"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-cyan-400 text-white flex items-center justify-center text-[11px] font-bold">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline max-w-[120px] truncate">{currentUser.name}</span>
            </button>
          </div>
        </header>

        {/* Isi Halaman */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{renderContent()}</main>
      </div>

      {/* Modal Login & Registrasi (Email + Akun Google) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 ${cardBg}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {googleStepOpen
                  ? 'Pilih Akun Google'
                  : authMode === 'login'
                  ? 'Masuk ke ATY AI STUDIO'
                  : 'Daftar Akun Gratis'}
              </h3>
              <button
                onClick={() => {
                  setAuthModalOpen(false);
                  setGoogleStepOpen(false);
                }}
              >
                <X className="w-5 h-5 opacity-60" />
              </button>
            </div>

            {googleStepOpen ? (
              <div className="space-y-3">
                <p className="text-xs opacity-70">
                  Pilih akun Google Anda atau masukkan alamat Gmail untuk masuk ke ATY AI STUDIO secara cepat dan gratis.
                </p>

                {/* Pilihan Akun Google Cepat */}
                <div className="space-y-2">
                  {[
                    { name: 'Kreator ATY', email: 'kreator.aty@gmail.com' },
                    { name: 'Admin Studio', email: 'admin.atystudio@gmail.com' }
                  ].map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={googleLoading}
                      onClick={() => handleGoogleLogin(acc.name, acc.email)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition hover:border-cyan-400 disabled:opacity-50 ${
                        darkMode ? 'bg-black/30 border-white/10 hover:bg-white/5' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {acc.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{acc.name}</p>
                        <p className="text-xs opacity-65 truncate">{acc.email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </button>
                  ))}
                </div>

                {/* Gunakan Akun Google Lain */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <label className="text-xs opacity-70 block">Gunakan akun Gmail lainnya</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={googleEmailInput}
                      onChange={(e) => setGoogleEmailInput(e.target.value)}
                      placeholder="namaanda@gmail.com"
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm ${inputBg}`}
                    />
                    <button
                      type="button"
                      disabled={googleLoading}
                      onClick={() => handleGoogleLogin('', googleEmailInput)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-semibold hover:brightness-110 disabled:opacity-50"
                    >
                      {googleLoading ? 'Memproses...' : 'Lanjut'}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setGoogleStepOpen(false)}
                  className="w-full py-2 text-xs opacity-70 hover:opacity-100 text-center"
                >
                  ← Kembali ke opsi masuk lainnya
                </button>
              </div>
            ) : (
              <>
                {/* Tombol Masuk dengan Google */}
                <button
                  type="button"
                  onClick={() => setGoogleStepOpen(true)}
                  className={`w-full py-2.5 px-4 rounded-xl border font-semibold text-sm flex items-center justify-center gap-3 transition ${
                    darkMode
                      ? 'bg-white text-slate-900 border-white/20 hover:bg-slate-100'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.51 5.51 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.57-5.15 3.57-8.65z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95H1.28v3.1A12 12 0 0 0 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4-3.1z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4 3.1c.95-2.84 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  {authMode === 'login' ? 'Masuk dengan Google' : 'Daftar dengan Google'}
                </button>

                {/* Pemisah */}
                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-white/10" />
                  <span className="shrink-0 mx-3 text-[11px] uppercase tracking-wider opacity-50">atau dengan email</span>
                  <div className="flex-grow border-t border-white/10" />
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  {authMode === 'register' && (
                    <div>
                      <label className="text-xs opacity-70 block mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        value={authForm.name}
                        onChange={(e) => setAuthForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Nama Anda"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${inputBg}`}
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs opacity-70 block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={authForm.email}
                      onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="nama@email.com"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs opacity-70 block mb-1">Kata Sandi</label>
                    <input
                      type="password"
                      required
                      value={authForm.password}
                      onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${inputBg}`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:brightness-110 transition"
                  >
                    {authMode === 'login' ? 'Masuk Sekarang' : 'Buat Akun Gratis'}
                  </button>
                </form>

                <p className="text-xs text-center opacity-70">
                  {authMode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                  <button
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="text-cyan-400 font-semibold hover:underline"
                  >
                    {authMode === 'login' ? 'Daftar Gratis' : 'Masuk'}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}