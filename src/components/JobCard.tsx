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

  const isWTTJ = source === "Welcome to the Jungle";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
    >
      <div className={`h-1 w-full ${isWTTJ ? "bg-amber-400" : "bg-emerald-500"}`} />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isWTTJ
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {source}
          </span>
          {timeAgo && <span className="text-xs text-gray-400">{timeAgo}</span>}
        </div>
        <h3 className="mb-1 text-sm font-semibold text-gray-900 group-hover:text-indigo-600 leading-snug">
          {title}
        </h3>
        <p className="text-xs text-gray-500">
          {company} · {location}
        </p>
        {salary && (
          <p className="mt-1 text-xs font-medium text-emerald-600">{salary}</p>
        )}
      </div>
    </a>
  );
}
