import OpenAI from "openai";

// OpenRouter is OpenAI-compatible, so we reuse the SDK
export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});
