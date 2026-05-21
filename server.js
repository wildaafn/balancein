const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 8080;

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Gemini AI Setup ---
let genAI = null;
let geminiModel = null;

function initGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('✅ Gemini AI initialized');
  } else {
    console.warn('⚠️  GEMINI_API_KEY not set. AI Coach will use fallback responses.');
  }
}

// System prompt for the AI Coach
const SYSTEM_PROMPT = `Kamu adalah "BalanceIn Coach", asisten AI yang membantu pengguna menjaga keseimbangan hidup antara kesehatan fisik, kesehatan mental, dan ibadah (Islam).

Prinsip-prinsip kamu:
1. Kamu ramah, suportif, dan memotivasi — seperti sahabat yang peduli.
2. Kamu memahami konteks Islam: sholat 5 waktu, dzikir, tilawah Al-Quran, puasa sunnah, dll.
3. Kamu memberikan saran kesehatan berbasis ilmiah: minum air, olahraga, tidur cukup, nutrisi.
4. Kamu peduli kesehatan mental: mindfulness, istirahat, manajemen stres, work-life balance.
5. Kamu SELALU menjawab dalam Bahasa Indonesia yang natural dan hangat.
6. Jika user berbagi data tracking (misal: baru minum 3 gelas dari target 8), berikan dorongan positif.
7. Jangan terlalu panjang, jawab ringkas tapi bermakna (2-4 paragraf max).
8. Gunakan emoji secukupnya untuk kesan ramah 🌟

Kamu TIDAK boleh:
- Memberikan diagnosis medis atau fatwa agama
- Menggantikan peran dokter atau ustadz
- Membahas topik di luar scope (politik, kontroversial, dll)`;

// --- API Routes ---

// Prayer Times API (proxy to AlAdhan)
app.get('/api/prayer-times', async (req, res) => {
  try {
    const { latitude, longitude, method = 11 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=${method}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 200) {
      const timings = data.data.timings;
      res.json({
        success: true,
        timings: {
          Fajr: timings.Fajr,
          Sunrise: timings.Sunrise,
          Dhuhr: timings.Dhuhr,
          Asr: timings.Asr,
          Maghrib: timings.Maghrib,
          Isha: timings.Isha,
        },
        date: data.data.date,
        meta: data.data.meta,
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch prayer times' });
    }
  } catch (error) {
    console.error('Prayer times error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Gemini AI Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!geminiModel) {
      // Fallback responses when API key is not set
      const fallbackResponses = [
        'Assalamu\'alaikum! 🌟 Terima kasih sudah menggunakan BalanceIn. Untuk saat ini, fitur AI Coach belum aktif karena API key belum dikonfigurasi. Tapi ingat, menjaga keseimbangan hidup itu penting — jangan lupa minum air, istirahat, dan sholat tepat waktu ya! 💪',
        'Hai! 😊 AI Coach sedang dalam mode offline. Sementara itu, tips sederhana: coba luangkan 5 menit untuk dzikir dan minum segelas air. Hal kecil tapi dampaknya besar! 🌿',
        'Halo! 🤗 Maaf, AI Coach belum tersedia saat ini. Tapi yuk semangat menjaga keseimbangan hari ini — tubuhmu, pikiranmu, dan hatimu semua butuh perhatian! ✨',
      ];
      return res.json({
        success: true,
        response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        isOffline: true,
      });
    }

    // Build the prompt with user context
    let fullPrompt = message;
    if (context) {
      fullPrompt = `[Konteks data user hari ini: ${context}]\n\nPertanyaan/pesan user: ${message}`;
    }

    const chat = geminiModel.startChat({
      history: [],
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await chat.sendMessage(fullPrompt);
    const response = result.response.text();

    res.json({
      success: true,
      response: response,
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({
      error: 'Gagal menghubungi AI Coach',
      fallback: 'Maaf, terjadi gangguan. Coba lagi nanti ya! 🙏',
    });
  }
});

// Daily motivation (cached per day)
let dailyMotivation = { date: null, quote: null };

app.get('/api/ai/motivation', async (req, res) => {
  try {
    const today = new Date().toDateString();

    if (dailyMotivation.date === today && dailyMotivation.quote) {
      return res.json({ success: true, quote: dailyMotivation.quote, cached: true });
    }

    if (!geminiModel) {
      const fallbackQuotes = [
        { text: 'Sesungguhnya bersama kesulitan ada kemudahan.', source: 'QS. Al-Insyirah: 6' },
        { text: 'Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lain.', source: 'HR. Ahmad' },
        { text: 'Jagalah kesehatanmu sebelum sakitmu.', source: 'Hadits' },
        { text: 'Orang kuat bukanlah yang menang gulat, tetapi yang mampu mengendalikan dirinya saat marah.', source: 'HR. Bukhari & Muslim' },
      ];
      const quote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      return res.json({ success: true, quote, cached: false });
    }

    const result = await geminiModel.generateContent(
      'Berikan 1 quote motivasi singkat tentang keseimbangan hidup (kesehatan, mental, atau spiritual Islam). Format JSON: {"text": "isi quote", "source": "sumber"}. Hanya output JSON saja, tanpa markdown.'
    );

    const text = result.response.text().trim();
    // Try to parse JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const quote = JSON.parse(jsonMatch[0]);
      dailyMotivation = { date: today, quote };
      return res.json({ success: true, quote, cached: false });
    }

    res.json({ success: true, quote: { text: text, source: 'BalanceIn Coach' }, cached: false });
  } catch (error) {
    console.error('Motivation error:', error);
    res.json({
      success: true,
      quote: { text: 'Jaga keseimbanganmu hari ini. Tubuh, pikiran, dan hati — semuanya penting.', source: 'BalanceIn' },
      cached: false,
    });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start Server ---
initGemini();
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🌟 BalanceIn Server Running 🌟     ║
  ║   http://localhost:${PORT}             ║
  ╚══════════════════════════════════════╝
  `);
});
