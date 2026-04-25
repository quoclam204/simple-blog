import Link from "next/link";
import { createClient } from "@/app/lib/supabase/server";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

interface SearchPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  published_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  rank: number;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getQueryTerms(query: string) {
  const terms = query
    .trim()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);
  return Array.from(new Set(terms));
}

function highlightText(text: string, query: string) {
  if (!text) return text;
  const terms = getQueryTerms(query);
  if (terms.length === 0) return text;
  const escapedTerms = terms.map(escapeRegExp).join("|");
  const regex = new RegExp(`(${escapedTerms})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, index) => {
    const isMatch = regex.test(part);
    regex.lastIndex = 0;
    if (!isMatch) {
      return part;
    }
    return (
      <mark key={`${part}-${index}`} className="bg-yellow-200 text-gray-900">
        {part}
      </mark>
    );
  });
}

function buildSnippet(
  excerpt: string | null,
  content: string | null,
  query: string,
  maxLength = 180,
) {
  const base = (excerpt && excerpt.trim().length > 0 ? excerpt : content) ?? "";
  const normalized = base.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const terms = getQueryTerms(query).map((term) => term.toLowerCase());
  if (terms.length === 0 || normalized.length <= maxLength) {
    return normalized.slice(0, maxLength);
  }
  const lower = normalized.toLowerCase();
  let firstIndex = -1;
  let matchLength = 0;
  for (const term of terms) {
    const index = lower.indexOf(term);
    if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
      firstIndex = index;
      matchLength = term.length;
    }
  }
  if (firstIndex === -1) {
    return `${normalized.slice(0, maxLength)}...`;
  }
  const paddingStart = Math.floor(maxLength * 0.35);
  const start = Math.max(0, firstIndex - paddingStart);
  const end = Math.min(normalized.length, start + maxLength + matchLength);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalized.length ? "..." : "";
  return `${prefix}${normalized.slice(start, end)}${suffix}`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const supabase = await createClient();
  let results: SearchPost[] = [];
  let errorMessage: string | null = null;

  if (query) {
    const { data, error } = await supabase.rpc("search_posts", {
      search_query: query,
      limit_count: 20,
      offset_count: 0,
    });

    if (error) {
      console.error("Search error:", error);
      errorMessage = "Không thể tìm kiếm lúc này. Vui lòng thử lại.";
    } else {
      results = (data ?? []) as SearchPost[];
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tìm kiếm bài viết</h1>
      <form action="/search" method="get" className="flex gap-3 mb-8">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Nhập từ khóa..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Tìm kiếm
        </button>
      </form>

      {query.length === 0 ? (
        <p className="text-gray-500">Nhập từ khóa để tìm bài viết.</p>
      ) : errorMessage ? (
        <p className="text-red-500">{errorMessage}</p>
      ) : results.length === 0 ? (
        <p className="text-gray-500">Không tìm thấy bài viết phù hợp.</p>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">
            Tìm thấy {results.length} kết quả cho "{query}".
          </p>
          {results.map((post) => {
            const snippet = buildSnippet(post.excerpt, post.content, query);
            return (
              <article
                key={post.id}
                className="bg-white p-6 rounded-lg shadow border border-gray-200"
              >
                <Link href={`/posts/${post.slug}`}>
                  <h2 className="text-2xl font-semibold hover:text-blue-600 transition-colors">
                    {highlightText(post.title, query)}
                  </h2>
                </Link>
                {snippet ? (
                  <p className="text-gray-600 mt-2">
                    {highlightText(snippet, query)}
                  </p>
                ) : null}
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>Bởi {post.display_name || "Ẩn danh"}</span>
                  <span>•</span>
                  <span>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("vi-VN")
                      : "Chưa xuất bản"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
