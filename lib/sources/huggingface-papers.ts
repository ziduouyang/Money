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

export async function fetchHuggingfacePapers(
  sourceId: string,
  limit = 10,
): Promise<RawArticle[]> {
  const resp = await fetch(HF_PAPERS_URL, {
    headers: { "User-Agent": "DailyBrief/1.0" },
  });
  if (!resp.ok) {
    throw new Error(`HF papers API returned ${resp.status}`);
  }
  const papers = (await resp.json()) as HfPaperEntry[];

  return papers.slice(0, limit).map((p) => {
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
