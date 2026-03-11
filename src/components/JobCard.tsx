import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  publishedAt: string;
  salary?: string;
}

export default function JobCard({
  title,
  company,
  location,
  url,
  source,
  publishedAt,
  salary,
}: JobCardProps) {
  const timeAgo = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
    : "";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-green-600 hover:bg-zinc-800/50"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            source === "Welcome to the Jungle"
              ? "bg-yellow-600/20 text-yellow-400"
              : "bg-green-600/20 text-green-400"
          }`}
        >
          {source}
        </span>
        {timeAgo && <span className="text-xs text-zinc-500">{timeAgo}</span>}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-white group-hover:text-green-400">
        {title}
      </h3>
      <p className="text-xs text-zinc-400">
        {company} · {location}
      </p>
      {salary && (
        <p className="mt-1 text-xs font-medium text-green-400">{salary}</p>
      )}
    </a>
  );
}
