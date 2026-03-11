interface PolymarketCardProps {
  title: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: number;
}

export default function PolymarketCard({
  title,
  outcomes,
  outcomePrices,
  volume,
}: PolymarketCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-purple-600/20 px-2 py-0.5 text-xs font-medium text-purple-400">
          Polymarket
        </span>
        {volume > 0 && (
          <span className="text-xs text-zinc-500">
            Vol: ${(volume / 1000).toFixed(0)}k
          </span>
        )}
      </div>
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <div className="space-y-2">
        {outcomes.map((outcome, i) => {
          const price = parseFloat(outcomePrices[i] || "0");
          const pct = Math.round(price * 100);
          return (
            <div key={outcome} className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-700">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-20 text-right text-xs text-zinc-300">
                {outcome}
              </span>
              <span className="w-10 text-right text-xs font-mono text-purple-400">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
