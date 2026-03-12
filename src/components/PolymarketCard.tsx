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
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="h-1 w-full bg-violet-500" />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
            Polymarket
          </span>
          {volume > 0 && (
            <span className="text-xs text-gray-400">
              Vol: ${(volume / 1000).toFixed(0)}k
            </span>
          )}
        </div>
        <h3 className="mb-4 text-sm font-semibold text-gray-900 leading-snug">{title}</h3>
        <div className="mt-auto space-y-3">
          {outcomes.map((outcome, i) => {
            const price = parseFloat(outcomePrices[i] || "0");
            const pct = Math.round(price * 100);
            return (
              <div key={outcome}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{outcome}</span>
                  <span className="font-mono font-semibold text-violet-600">{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
