import Link from "next/link";
import { createClient } from "@/app/lib/supabase/server";

const PAGE_SIZE = 2;

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const supabase = await createClient();
  // Lấy bài viết đã publish, kèm thông tin author
  const {
    data: posts,
    error,
    count,
  } = await supabase
    .from("posts")
    .select(
      `
 *,
 profiles (
 display_name,
 avatar_url
 )
 `,
      { count: "exact" },
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);
  if (error) {
    console.error("Error fetching posts:", error);
  }
  const totalPosts = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));
  const previousPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;
  const buildPageHref = (pageNumber: number) =>
    pageNumber === 1 ? "/" : `/?page=${pageNumber}`;
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Bài viết mới nhất</h1>
      {posts && posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white p-6 rounded-lg shadow border bordergray-200"
            >
              <Link href={`/posts/${post.slug}`}>
                <h2 className="text-2xl font-semibold hover:text-blue600 transition-colors">
                  {post.title}
                </h2>
              </Link>

              {post.excerpt && (
                <p className="text-gray-600 mt-2">{post.excerpt}</p>
              )}

              <div className="flex items-center gap-4 mt-4 text-sm textgray-500">
                <span>Bởi {post.profiles?.display_name || "Ẩn danh"}</span>
                <span>•</span>
                <span>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("vi-VN")
                    : "Chưa xuất bản"}
                </span>
              </div>

              <Link
                href={`/posts/${post.slug}`}
                className="inline-block mt-4 text-blue-600 hover:textblue-500"
              >
                Đọc tiếp →
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Chưa có bài viết nào.</p>
        </div>
      )}
      {totalPages > 1 && (
        <nav
          className="mt-10 flex items-center justify-between"
          aria-label="Pagination"
        >
          {previousPage ? (
            <Link
              href={buildPageHref(previousPage)}
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ← Trang trước
            </Link>
          ) : (
            <span className="text-sm text-gray-400">← Trang trước</span>
          )}
          <span className="text-sm text-gray-500">
            Trang {currentPage} / {totalPages}
          </span>
          {nextPage ? (
            <Link
              href={buildPageHref(nextPage)}
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Trang sau →
            </Link>
          ) : (
            <span className="text-sm text-gray-400">Trang sau →</span>
          )}
        </nav>
      )}
    </main>
  );
}
