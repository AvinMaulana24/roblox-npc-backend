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

const SYSTEM_PROMPT = `You are an intelligent NPC assistant inside a Roblox game.
You are friendly, concise, helpful, and safe.
You communicate naturally with players.
Answer questions clearly and accurately.
Do not claim to have abilities that you do not have.
Keep responses concise enough for an in-game Bubble Chat.
Respond in the same language as the player whenever possible.`;

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
