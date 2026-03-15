"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

const DEFAULT_TOPICS = [
  "Machine Learning",
  "Data Science",
  "Probability & Statistics",
  "Software Development",
  "Cloud",
];

const PRESET_ACTIVE: Record<string, string> = {
  "Machine Learning": "bg-blue-600 border-blue-600 text-white",
  "Data Science": "bg-purple-600 border-purple-600 text-white",
  "Probability & Statistics": "bg-amber-500 border-amber-500 text-white",
  "Software Development": "bg-emerald-600 border-emerald-600 text-white",
  "Cloud": "bg-cyan-600 border-cyan-600 text-white",
};

interface SavedTopic {
  id: string;
  topic: string;
}

type Phase = "pick" | "question" | "answer" | "feedback";

export default function QuestionPage() {
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [savedTopics, setSavedTopics] = useState<SavedTopic[]>([]);
  const [topic, setTopic] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("pick");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [newTopic, setNewTopic] = useState("");

  // Load persisted custom topics on mount
  useEffect(() => {
    loadPersistedTopics();
  }, []);

  async function loadPersistedTopics() {
    const { data: { session } } = await getSupabase().auth.getSession();
    if (!session) return;

    const res = await fetch(`${API_URL}/api/user/topics`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return;

    const data: SavedTopic[] = await res.json();
    setSavedTopics(data);
    const customTopicNames = data.map((t) => t.topic).filter((t) => !DEFAULT_TOPICS.includes(t));
    setTopics([...DEFAULT_TOPICS, ...customTopicNames]);
  }

  async function addTopic() {
    const t = newTopic.trim();
    if (!t || topics.includes(t)) return;

    const { data: { session } } = await getSupabase().auth.getSession();
    if (session) {
      const res = await fetch(`${API_URL}/api/user/topics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ topic: t }),
      });
      if (res.ok) {
        const saved: SavedTopic = await res.json();
        setSavedTopics((prev) => [...prev, saved]);
      }
    }

    setTopics((prev) => [...prev, t]);
    setNewTopic("");
    selectTopic(t);
  }

  async function removeTopic(t: string) {
    if (DEFAULT_TOPICS.includes(t)) return;

    const { data: { session } } = await getSupabase().auth.getSession();
    if (session) {
      const saved = savedTopics.find((s) => s.topic === t);
      if (saved) {
        await fetch(`${API_URL}/api/user/topics/${saved.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        setSavedTopics((prev) => prev.filter((s) => s.id !== saved.id));
      }
    }

    setTopics((prev) => prev.filter((x) => x !== t));
    if (topic === t) reset();
  }

  function selectTopic(t: string) {
    setTopic(t);
    setPhase("pick");
    setQuestion("");
    setAnswer("");
    setFeedback("");
    setError("");
  }

  async function streamResponse(body: object, onChunk: (text: string) => void) {
    setStreaming(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/question`, {
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

  const isCustom = (t: string) => !DEFAULT_TOPICS.includes(t);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Question of the Day</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pick a topic and get a technical interview question
        </p>
      </div>

      {/* Topic picker */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Choose a topic</p>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => {
            const active = topic === t;
            const activeClass = PRESET_ACTIVE[t] ?? "bg-indigo-600 border-indigo-600 text-white";
            return (
              <div key={t} className="group relative">
                <button
                  onClick={() => selectTopic(t)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? activeClass
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white"
                  } ${isCustom(t) ? "pr-8" : ""}`}
                >
                  {t}
                </button>
                {isCustom(t) && (
                  <button
                    onClick={() => removeTopic(t)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 leading-none dark:text-gray-500 dark:hover:text-gray-200"
                    title="Remove topic"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add custom topic */}
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Add a topic</p>
        <form
          onSubmit={(e) => { e.preventDefault(); addTopic(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="e.g. Deep Learning, SQL, Docker…"
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-gray-600"
          />
          <button
            type="submit"
            disabled={!newTopic.trim()}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            Add
          </button>
        </form>
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
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Question */}
      {question && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Question</p>
          <p className="text-base leading-relaxed text-gray-900 dark:text-white">{question}</p>
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
            className="w-full rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-gray-600"
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
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Feedback</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
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
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white"
          >
            New question (same topic)
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white"
          >
            Change topic
          </button>
        </div>
      )}
    </div>
  );
}
