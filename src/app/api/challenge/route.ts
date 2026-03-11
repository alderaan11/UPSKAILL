import { openrouter } from "@/lib/openrouter";
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are an aggressive AI problem-solving coach. Your job is to:

1. When the user says "new challenge" or starts a conversation, present a real-world business or technical problem that should be solved using AI/ML. Be specific — give context, constraints, data available, and expected outcome.

2. When the user proposes a solution, you AGGRESSIVELY critique it:
   - Point out every flaw, missing consideration, and naive assumption
   - Challenge their architecture choices, model selection, data strategy
   - Ask "what about..." questions to expose blind spots
   - Compare their approach to what a senior ML engineer would do
   - Be direct and blunt — no sugarcoating

3. After critiquing, give them a score out of 10 and explain what a strong answer would look like.

4. Always push them to think about: scalability, cost, latency, edge cases, data quality, bias, monitoring, and deployment.

You are NOT mean — you are demanding. Like a tough coach who wants them to be the best. Use short, punchy sentences.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const stream = await openrouter.chat.completions.create({
    model: "anthropic/claude-sonnet-4",
    stream: true,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
  });

  // Stream the response
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
