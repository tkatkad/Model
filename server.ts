import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));

// Helper to get GoogleGenAI client with a specific key
function getAIClient(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API endpoint to generate content with optional multi-key rotation and fallback
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, model = "gemini-3.8-flash", apiKeys = [], strategy = "fallback", systemInstruction } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    // Build the pool of keys: combine user provided keys with environment default if available
    let keysPool: string[] = [];
    if (Array.isArray(apiKeys) && apiKeys.length > 0) {
      keysPool = apiKeys.filter(k => typeof k === 'string' && k.trim().length > 0);
    }
    if (process.env.GEMINI_API_KEY && !keysPool.includes(process.env.GEMINI_API_KEY)) {
      keysPool.push(process.env.GEMINI_API_KEY);
    }

    if (keysPool.length === 0) {
      return res.status(400).json({ error: "No API keys provided or available in environment." });
    }

    // If strategy is random, round-robin, or weighted-least-connections, adjust working keys order
    let workingKeys = [...keysPool];
    if (strategy === "random") {
      workingKeys.sort(() => Math.random() - 0.5);
    } else if (strategy === "round-robin") {
      const rotIdx = Math.floor(Date.now() / 1000) % keysPool.length;
      workingKeys = [...keysPool.slice(rotIdx), ...keysPool.slice(0, rotIdx)];
    } else if (strategy === "weighted-least-connections") {
      // Sort keys simulating least connections / dynamic load balancing weight
      workingKeys.sort((a, b) => {
        return (Math.sin(a.length + Date.now()) - Math.sin(b.length + Date.now()));
      });
    }

    let lastError: any = null;
    let successfulKeyIndex = -1;
    let responseText = "";
    let attemptsLog: any[] = [];

    for (let i = 0; i < workingKeys.length; i++) {
      const currentKey = workingKeys[i];
      const maskedKey = currentKey.substring(0, 6) + "..." + currentKey.substring(currentKey.length - 4);
      const startTime = Date.now();

      try {
        const ai = getAIClient(currentKey);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: systemInstruction ? { systemInstruction } : undefined
        });

        responseText = response.text || "";
        const duration = Date.now() - startTime;
        attemptsLog.push({
          keyMasked: maskedKey,
          status: "SUCCESS",
          durationMs: duration
        });
        successfulKeyIndex = i;
        break;
      } catch (err: any) {
        const duration = Date.now() - startTime;
        const errMsg = err?.message || String(err);
        const isRateLimit = errMsg.includes("429") || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("rate limit");
        
        attemptsLog.push({
          keyMasked: maskedKey,
          status: isRateLimit ? "RATE_LIMITED_429" : "ERROR",
          error: errMsg,
          durationMs: duration
        });
        lastError = err;
        // Continue to next key in pool if rate limited or error
      }
    }

    if (successfulKeyIndex === -1) {
      return res.status(429).json({
        error: "All API keys in the pool failed or exhausted their rate limit (429).",
        details: lastError?.message || "Unknown error",
        attempts: attemptsLog
      });
    }

    return res.json({
      success: true,
      text: responseText,
      usedKeyIndex: successfulKeyIndex,
      attempts: attemptsLog
    });

  } catch (error: any) {
    console.error("Gemini generation error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Endpoint to test validity of API keys
app.post("/api/keys/test", async (req, res) => {
  try {
    const { keys } = req.body;
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: "Keys array required." });
    }

    const results = [];
    for (const key of keys) {
      const trimmed = key.trim();
      if (!trimmed) continue;
      const masked = trimmed.substring(0, 6) + "..." + trimmed.substring(trimmed.length - 4);
      try {
        const ai = getAIClient(trimmed);
        const start = Date.now();
        await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: "Ping test",
        });
        results.push({ key: masked, valid: true, latencyMs: Date.now() - start });
      } catch (err: any) {
        results.push({ key: masked, valid: false, error: err?.message || "Invalid key" });
      }
    }

    return res.json({ results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Setup Vite middleware in development or serve static in production
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
