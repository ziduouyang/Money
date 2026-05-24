import type { RawArticle } from "./types";

interface HfPaperAuthor {
  name: string;
  affiliation?: string;
}

interface HfPaperDetail {
  id: string;
  title: string;
  summary?: string;
  authors?: HfPaperAuthor[];
  publishedAt?: string;
  arxivId?: string;
}

interface HfPaperEntry {
  id: string;
  title: string;
  summary?: string;
  upvotes: number;
  paper?: HfPaperDetail;
  submittedAt?: string;
}

const HF_PAPERS_URL = "https://huggingface.co/api/papers";

/** Keyword list for topic filtering (case-insensitive). */
const TOPIC_KEYWORDS = [
  "reinforcement learning",
  "world model",
  "agentic",
  "model-based reinforcement",
  "model based reinforcement",
  "deep rl",
  "mbrl",
  "multi-agent reinforcement",
];

function matchesTopic(title: string, excerpt: string): boolean {
  const text = `${title} ${excerpt}`.toLowerCase();
  return TOPIC_KEYWORDS.some((kw) => text.includes(kw));
}

/**
 * Fetch today's trending papers from HuggingFace, filter to RL / World Model /
 * Agentic RL topics, and return up to `limit` papers preserving HF's ranking.
 */
export async function fetchHuggingfacePapers(
  sourceId: string,
  limit = 20,
): Promise<RawArticle[]> {
  const resp = await fetch(HF_PAPERS_URL, {
    headers: { "User-Agent": "DailyBrief/1.0" },
  });
  if (!resp.ok) {
    throw new Error(`HF papers API returned ${resp.status}`);
  }
  const papers = (await resp.json()) as HfPaperEntry[];

  const filtered = papers
    .filter((p) => {
      const detail = p.paper;
      return matchesTopic(p.title, p.summary ?? detail?.summary ?? "");
    })
    .slice(0, limit);

  return filtered.map((p) => {
    const detail = p.paper;
    const authors =
      detail?.authors
        ?.slice(0, 4)
        .map((a) => a.name)
        .join(", ") ?? "";
    const arxivId = detail?.arxivId;

    return {
      sourceId,
      title: p.title,
      url: arxivId
        ? `https://arxiv.org/abs/${arxivId}`
        : `https://huggingface.co/papers/${p.id}`,
      excerpt: (p.summary ?? detail?.summary ?? "").slice(0, 400),
      publishedAt: p.submittedAt
        ? new Date(p.submittedAt)
        : detail?.publishedAt
          ? new Date(detail.publishedAt)
          : undefined,
      category: "tech" as const,
      meta: `${p.upvotes} upvotes${authors ? " · " + authors : ""}`,
    };
  });
}
