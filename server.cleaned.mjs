import fetch, { Headers, Blob } from "node-fetch";
import { FormData } from "formdata-node";

globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Blob = Blob;
globalThis.FormData = FormData;

import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });

console.log("Using OpenAI API key:", process.env.OPENAI_API_KEY);

import express from "express";
import cors from "cors";
import OpenAI from "openai";
(async () => {
  const fetch = (await import("node-fetch")).default;
  globalThis.fetch = fetch;

  const app = express();
  const PORT = 3001;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Set up OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  /**
   * Route 2: Clock
   */
  app.post("/api/analyze", async (req, res) => {
    const { memory } = req.body;

    if (!memory) {
      return res.status(400).json({ error: "Memory text is required." });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a poetic memory analyst. When given a memory about love, return exactly two lines:
1. A one-word emotional tone (choose from: joy, grief, awe, longing, nostalgia, serenity, dread, surprise, bittersweet, wonder, melancholy).
2. A poetic one-line caption for how this moment alters time.
Do not label the lines. Just return:
Longing
"In longing’s glow, the moon’s whispers stretch seconds to infinity."`,
          },
          {
            role: "user",
            content: memory,
          },
        ],
      });

      const response = completion.choices[0].message.content.trim();
      console.log("AI raw response:", response);

      const lines = response
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      // Case 1: Emotion on first line, caption on second
      if (lines.length >= 2) {
        const emotion = lines[0].replace(/[^a-zA-Z]/g, "").toLowerCase(); // e.g. "Longing" → "longing"
        const caption = lines[1].replace(/^["“”']+|["“”']+$/g, ""); // remove quotes
        return res.json({ emotion, caption });
      }

      // Case 2: Fallback
      return res
        .status(500)
        .json({ error: "Failed to parse response", raw: response });
    } catch (error) {
      console.error("OpenAI error:", error.response?.data || error.message);
      res.status(500).json({ error: "Something went wrong" });
    }
  });

  /**
   * Route 2: Memory Loom
   * POST /api/summarize
   * Expects: { memory: "..." }
   * Returns: { summary }
   */
  app.post("/api/summarize", async (req, res) => {
    const { memory } = req.body;

    if (!memory) {
      return res.status(400).json({ error: "No memory provided" });
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Summarize this memory into a very short poetic phrase (maximum 4 words). 
Avoid quotation marks or full sentences. Use imagery or metaphor.`,
          },
          {
            role: "user",
            content: memory,
          },
        ],
      });

      const summary = response.choices[0].message.content
        .trim()
        .replace(/^["“']+|["”']+$/g, "");

      res.json({ summary });
    } catch (err) {
      console.error("❌ OpenAI summarization failed:", err);
      res.status(500).json({ error: "OpenAI API error" });
    }
  });

  /**
   * Route 3: Mirror Insight
   * POST /api/mirror-insight
   * Expects: { interactionSummary: "..." }
   * Returns: { insight }
   */
  app.post("/api/mirror-insight", async (req, res) => {
    const { interactionSummary } = req.body;

    if (!interactionSummary) {
      return res.status(400).json({ error: "No interaction summary provided" });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a reflective digital mirror. When given a behavioral summary of how someone interacted with the mirror (breaking, circling, waiting, hesitation), return a 2–3 sentence insight addressed directly to them using "you". Speak in clear, emotionally observant language. Use poetic or abstract phrasing sparingly — only when it deepens the insight. Do not exceed 60 words.`,
          },
          {
            role: "user",
            content: interactionSummary,
          },
        ],
      });

      const insight = completion.choices[0].message.content.trim();
      res.json({ insight });
    } catch (err) {
      console.error("❌ Mirror insight error:", err);
      res.status(500).json({ error: "OpenAI API error" });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
})();
