import { getOpenRouter } from "@/lib/openrouter";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const TOPIC_PROMPTS: Record<string, string> = {
  "Machine Learning": "machine learning (algorithms, model evaluation, overfitting, feature engineering, ensembles, etc.)",
  "Data Science": "data science (EDA, data cleaning, visualization, feature selection, pipelines, etc.)",
  "Probability & Statistics": "probability and statistics (distributions, hypothesis testing, Bayesian inference, confidence intervals, etc.)",
  "Software Development": "software development (design patterns, algorithms, data structures, clean code, testing, etc.)",
  "Cloud": "cloud computing (AWS/GCP/Azure services, architecture, scalability, serverless, containers, etc.)",
};

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY is not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { topic, mode, question, answer } = await req.json();
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return new Response(JSON.stringify({ error: "Topic is required" }), { status: 400 });
  }
  // Use predefined description if available, otherwise use the topic name directly
  const topicDesc = TOPIC_PROMPTS[topic] ?? topic;

  let prompt: string;

  if (mode === "question") {
    prompt = `You are a technical interviewer. Ask ONE clear, specific question about ${topicDesc}.

Rules:
- Ask only one question, no sub-questions
- Make it practical and thought-provoking, not trivial
- Do NOT answer it yourself
- Do NOT add any preamble like "Here's a question:" — just ask the question directly`;
  } else {
    prompt = `You are a technical interviewer. The candidate answered a question.

Topic: ${topic}
Question: ${question}
Answer: ${answer}

Evaluate concisely:
1. Is the answer correct? What's right or wrong?
2. What key points were missed?
3. Give a score out of 10.

Be direct and educational. Max 150 words.`;
  }

  let stream;
  try {
    stream = await getOpenRouter().chat.completions.create({
      model: "anthropic/claude-sonnet-4-5",
      stream: true,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
