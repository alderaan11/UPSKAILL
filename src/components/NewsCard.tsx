import { formatDistanceToNow } from "date-fns";

interface NewsCardProps {
  title: string;
  snippet: string;
  source: string;
  url: string;
  date: string;
  imageUrl?: string | null;
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
      className="group block rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-blue-600 hover:bg-zinc-800/50"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="mb-3 h-40 w-full rounded-lg object-cover"
        />
      )}
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-xs font-medium text-blue-400">
          {source}
        </span>
        {timeAgo && (
          <span className="text-xs text-zinc-500">{timeAgo}</span>
        )}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-white group-hover:text-blue-400">
        {title}
      </h3>
      {snippet && (
        <p className="text-xs leading-relaxed text-zinc-400 line-clamp-2">
          {snippet}
        </p>
      )}
    </a>
  );
}
