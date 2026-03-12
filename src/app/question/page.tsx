"use client";

import { useState } from "react";

const TOPICS = [
  "Machine Learning",
  "Data Science",
  "Probability & Statistics",
  "Software Development",
  "Cloud",
];

const TOPIC_ACTIVE: Record<string, string> = {
  "Machine Learning": "bg-blue-600 border-blue-600 text-white",
  "Data Science": "bg-purple-600 border-purple-600 text-white",
  "Probability & Statistics": "bg-amber-500 border-amber-500 text-white",
  "Software Development": "bg-emerald-600 border-emerald-600 text-white",
  "Cloud": "bg-cyan-600 border-cyan-600 text-white",
};

type Phase = "pick" | "question" | "answer" | "feedback";

export default function QuestionPage() {
  const [topic, setTopic] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("pick");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");

  async function streamResponse(body: object, onChunk: (text: string) => void) {
    setStreaming(true);
    setError("");
    try {
      const res = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Erreur ${res.status}`);
        setStreaming(false);
        return;
      }

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
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
    setError("");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Question of the Day</h1>
        <p className="text-sm text-gray-500">
          Pick a topic and get a technical interview question
        </p>
      </div>

      {/* Topic picker */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-gray-700">Choose a topic</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const active = topic === t;
            return (
              <button
                key={t}
                onClick={() => { setTopic(t); setPhase("pick"); setQuestion(""); setAnswer(""); setFeedback(""); setError(""); }}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? TOPIC_ACTIVE[t]
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 shadow-sm"
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
          className="mb-6 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-40"
        >
          {streaming && phase === "question" ? "Generating…" : "Get Question"}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Question */}
      {question && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Question</p>
          <p className="text-base leading-relaxed text-gray-900">{question}</p>
        </div>
      )}

      {/* Answer input */}
      {question && !streaming && phase !== "feedback" && (
        <div className="mb-6">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here…"
            rows={5}
            className="w-full rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-gray-400"
          />
          <button
            onClick={submitAnswer}
            disabled={!answer.trim()}
            className="mt-3 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-40"
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Feedback */}
      {(feedback || (streaming && phase === "feedback")) && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Feedback</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {feedback}
            {streaming && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-gray-400" />}
          </p>
        </div>
      )}

      {/* Try again */}
      {phase === "feedback" && !streaming && (
        <div className="flex gap-2">
          <button
            onClick={generateQuestion}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            New question (same topic)
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            Change topic
          </button>
        </div>
      )}
    </div>
  );
}
