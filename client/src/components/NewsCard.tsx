import { formatDistanceToNow } from "date-fns";

interface NewsCardProps {
  title: string;
  snippet: string;
  source: string;
  url: string;
  date: string;
  imageUrl?: string | null;
}

function accentColor(source: string): string {
  const s = source.toLowerCase();
  if (s.includes("reddit")) return "bg-orange-500";
  if (s.includes("arxiv")) return "bg-amber-500";
  if (s.includes("polymarket")) return "bg-violet-500";
  if (s.includes("twitter") || s.includes("x.com") || s.includes("@")) return "bg-sky-500";
  if (s.includes("hugging") || s.includes("hf")) return "bg-yellow-500";
  return "bg-indigo-500";
}

export default function NewsCard({
  title,
  snippet,
  source,
  url,
  date,
  imageUrl,
}: NewsCardProps) {
  const timeAgo = date
    ? formatDistanceToNow(new Date(date), { addSuffix: true })
    : "";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className={`h-1 w-full ${accentColor(source)}`} />
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {source}
          </span>
          {timeAgo && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo}</span>
          )}
        </div>
        <h3 className="mb-1 text-sm font-semibold leading-snug text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
          {title}
        </h3>
        {snippet && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {snippet}
          </p>
        )}
      </div>
    </a>
  );
}
