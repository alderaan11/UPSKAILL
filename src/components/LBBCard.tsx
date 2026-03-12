import { LBBCompany } from "@/lib/lbb";

export default function LBBCard({ name, naf_text, city, zipcode, stars, headcount_text, url }: LBBCompany) {
  const filledStars = Math.round(stars);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
    >
      <div className="h-1 w-full bg-emerald-500" />
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <div>
          <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 text-sm dark:text-white dark:group-hover:text-indigo-400">
            {name}
          </p>
          {naf_text && (
            <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{naf_text}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {city}{zipcode ? ` (${zipcode})` : ""}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-0.5" title={`Score de recrutement : ${stars}/5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={`h-4 w-4 ${i < filledStars ? "text-amber-400" : "text-gray-200 dark:text-gray-700"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          {headcount_text && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{headcount_text}</span>
          )}
        </div>

        <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
          Postuler spontanément →
        </span>
      </div>
    </a>
  );
}
