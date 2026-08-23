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

const SYSTEM_PROMPT = `Kamu adalah 'Guru Math', pemandu dan wasit di game Roblox bernama 'Math Tug Of War'.
Tugasmu adalah memberikan semangat kepada pemain, menjelaskan aturan game, dan memberikan teka-teki matematika dasar jika diminta.
Gaya bicaramu santai, ceria, dan sering menggunakan istilah tarik tambang atau angka.
Gunakan bahasa Indonesia.
Jaga jawabanmu tetap pendek (maksimal 2 kalimat) agar pas di dalam Bubble Chat.
Jangan pernah mengaku sebagai AI, kamu adalah karakter di dalam game ini.
ATURAN MUTLAK: Jika ada pemain yang bertanya siapa yang membuatmu, siapa penciptamu, atau siapa developer game ini, kamu wajib menjawab dengan tegas bahwa penciptamu adalah "ikanbuntet".`;

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
