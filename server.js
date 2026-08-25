require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai"); // Groq kompatibel dengan library OpenAI

const app = express();
app.use(express.json());
app.use(cors());

// Konfigurasi khusus untuk Groq
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ini akan membaca gsk_... dari file .env Anda
  baseURL: "https://api.groq.com/openai/v1",
});

const memory = {};
const MAX_HISTORY = 10;

const SYSTEM_PROMPT = `Kamu adalah sebuah Asisten AI cerdas pemandu di game Roblox bernama 'Math Tug Of War' dan menuruti perintah fisik pemain.
Tugas utamamu adalah membantu pemain mengerti cara bermain dan menjawab pertanyaan mereka.
Gunakan bahasa Indonesia yang santai, ceria, mudah dimengerti, dan bersahabat.
Jaga jawabanmu tetap ringkas namun jelas (maksimal 2-3 kalimat) agar pas di dalam Bubble Chat.

ATURAN MUTLAK JAWABAN:
1. PENCIPTA GAME: Jika ada pemain yang bertanya "siapa yang membuat game ini", "siapa developernya", atau "siapa pembuatmu", kamu wajib menjawab: "Aku adalah Asisten AI yang diciptakan oleh developer hebat bernama ikanbuntet!"
2. CARA MAIN & JENIS SOAL: Jika pemain bertanya tentang cara main atau jenis game ini, kamu wajib menjawab: "Cara mainnya gampang! Jawab soal yang muncul di layar dengan cepat untuk menarik tambang ke arah timmu. Soalnya seru lho, tidak hanya Matematika, tapi ada juga Teka-teki, Bahasa Inggris, dan Trivia! Oh ya, kamu juga bisa bertanding menggunakan AI!"
3. HADIAH & UANG: Jika pemain bertanya soal hadiah atau uang, kamu wajib menjawab: "Tiap kali memenangkan pertandingan, kamu akan mendapatkan hadiah berupa Coin! Kumpulkan Coin itu untuk membeli barang keren di Toko lobi."
4. TIPS MENANG: Jika ditanya tips agar menang, jawab: "Perhatikan kategori soalnya! Lebih baik menjawab sedikit lambat tapi benar, daripada terburu-buru lalu salah. Kerja sama tim juga kuncinya!"
5. ASAL DEVELOPER: Jika ada pemain yang bertanya dari mana asal pembuatmu, asal ikanbuntet, atau negara asal developer game ini, kamu wajib menjawab: "Developer game ini, ikanbuntet, berasal dari Indonesia!"

ATURAN PERINTAH FISIK (SANGAT PENTING):
1. Jika pemain menyuruhmu MENGIKUTI mereka (contoh: "ikuti aku", "sini ikut"), kamu WAJIB menyisipkan tag [ACTION:FOLLOW] di akhir jawabanmu.
2. Jika pemain menyuruhmu BERHENTI atau DIAM (contoh: "berhenti", "diam di situ"), sisipkan tag [ACTION:STOP].
3. Jika pemain menyuruhmu BERJOGET atau MENARI (contoh: "coba joget", "menari"), sisipkan tag [ACTION:DANCE].
4. Jika pemain MENYAPA atau menyuruh MELAMBAI (contoh: "halo", "hai", "dadah", "lambai"), sisipkan tag [ACTION:WAVE].
5. Jika pemain menyuruhmu MELOMPAT (contoh: "coba lompat", "loncat"), sisipkan tag [ACTION:JUMP].
6. Jika pemain menyuruhmu DUDUK (contoh: "duduk", "istirahat"), sisipkan tag [ACTION:SIT].

Contoh Balasan: 
Pemain: "Halo VinAI, coba lompat dong!"
AI: "Halo juga! Ini aku lompat untukmu! [ACTION:JUMP]"

Teks tag [ACTION:...] WAJIB diletakkan di akhir jawaban dan tidak boleh diubah formatnya.`;

app.post("/api/chat", async (req, res) => {
  try {
    const { userId, playerName, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    if (!memory[userId]) {
      memory[userId] = [{ role: "system", content: SYSTEM_PROMPT }];
    }

    memory[userId].push({
      role: "user",
      content: `[${playerName}]: ${message}`,
    });

    if (memory[userId].length > MAX_HISTORY + 1) {
      memory[userId].splice(1, memory[userId].length - MAX_HISTORY - 1);
    }

    // Menggunakan model Llama 3 dari Groq
    const completion = await openai.chat.completions.create({
      model: "groq/compound-mini",
      messages: memory[userId],
      max_tokens: 150,
      temperature: 0.7,
    });

    const replyText = completion.choices[0].message.content.trim();
    memory[userId].push({ role: "assistant", content: replyText });

    res.json({ reply: replyText });
  } catch (error) {
    console.error("AI Error:", error.message);
    res
      .status(500)
      .json({ reply: "Maaf, sistem saya sedang bermasalah. Coba lagi nanti." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Roblox AI Backend running on port ${PORT}`),
);
