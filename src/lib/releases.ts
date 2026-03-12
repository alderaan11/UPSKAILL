import Parser from "rss-parser";

const parser = new Parser();

export interface PackageRelease {
  package: string;
  version: string;
  link: string;
  pubDate: string;
  notes: string;
}

const PACKAGES = [
  { name: "vLLM", feed: "https://github.com/vllm-project/vllm/releases.atom" },
  { name: "Unsloth", feed: "https://github.com/unslothai/unsloth/releases.atom" },
  { name: "Transformers", feed: "https://github.com/huggingface/transformers/releases.atom" },
];

export async function fetchPackageReleases(): Promise<PackageRelease[]> {
  const results = await Promise.allSettled(
    PACKAGES.map(async ({ name, feed }) => {
      const parsed = await parser.parseURL(feed);
      return (parsed.items || []).slice(0, 5).map((item) => ({
        package: name,
        version: item.title?.trim() || "unknown",
        link: item.link || "",
        pubDate: item.pubDate || item.isoDate || "",
        notes: (item.contentSnippet || item.content || "").slice(0, 300).trim(),
      }));
    })
  );

  const releases: PackageRelease[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") releases.push(...result.value);
  }

  return releases.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}
