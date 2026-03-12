"use client";

import { useState } from "react";

const TOPICS = [
  "Machine Learning",
  "Data Science",
  "Probability & Statistics",
  "Software Development",
  "Cloud",
];

const TOPIC_COLORS: Record<string, string> = {
  "Machine Learning": "border-blue-600 bg-blue-600",
  "Data Science": "border-purple-600 bg-purple-600",
  "Probability & Statistics": "border-yellow-600 bg-yellow-600",
  "Software Development": "border-green-600 bg-green-600",
  "Cloud": "border-cyan-600 bg-cyan-600",
};

type Phase = "pick" | "question" | "answer" | "feedback";

export default function QuestionPage() {
  const [topic, setTopic] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("pick");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [streaming, setStreaming] = useState(false);

  async function streamResponse(body: object, onChunk: (text: string) => void) {
    setStreaming(true);
    const res = await fetch("/api/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const { text } = JSON.parse(payload);
            if (text) onChunk(text);
          } catch {}
        }
      }
    }
    setStreaming(false);
  }

  async function generateQuestion() {
    if (!topic) return;
    setQuestion("");
    setAnswer("");
    setFeedback("");
    setPhase("question");
    await streamResponse({ topic, mode: "question" }, (text) =>
      setQuestion((prev) => prev + text)
    );
  }

  async function submitAnswer() {
    if (!answer.trim()) return;
    setFeedback("");
    setPhase("feedback");
    await streamResponse({ topic, mode: "evaluate", question, answer }, (text) =>
      setFeedback((prev) => prev + text)
    );
  }

  function reset() {
    setTopic(null);
    setPhase("pick");
    setQuestion("");
    setAnswer("");
    setFeedback("");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Question of the Day</h1>
        <p className="text-sm text-zinc-400">
          Pick a topic and get a question from an open-source model
        </p>
      </div>

      {/* Topic picker */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-zinc-300">Choose a topic</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const active = topic === t;
            const color = TOPIC_COLORS[t];
            return (
              <button
                key={t}
                onClick={() => { setTopic(t); setPhase("pick"); setQuestion(""); setAnswer(""); setFeedback(""); }}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? `${color} text-white border-transparent`
                    : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500 hover:text-white"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate button */}
      {topic && (
        <button
          onClick={generateQuestion}
          disabled={streaming}
          className="mb-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {streaming && phase === "question" ? "Generating…" : "Get Question"}
        </button>
      )}

      {/* Question */}
      {question && (
        <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900 p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Question</p>
          <p className="text-base leading-relaxed text-white">{question}</p>
        </div>
      )}

      {/* Answer input — show after question is fully streamed */}
      {question && !streaming && phase !== "feedback" && (
        <div className="mb-6">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here…"
            rows={5}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
          />
          <button
            onClick={submitAnswer}
            disabled={!answer.trim()}
            className="mt-3 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Feedback */}
      {(feedback || (streaming && phase === "feedback")) && (
        <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900 p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Feedback</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
            {feedback}
            {streaming && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-400" />}
          </p>
        </div>
      )}

      {/* Try again */}
      {phase === "feedback" && !streaming && (
        <div className="flex gap-3">
          <button
            onClick={generateQuestion}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            New question (same topic)
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Change topic
          </button>
        </div>
      )}
    </div>
  );
}
