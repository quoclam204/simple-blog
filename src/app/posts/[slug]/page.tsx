import { createClient } from "@/app/lib/supabase/server";
import { LikeButton } from "@/app/components/posts/like-button";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
interface PostPageProps {
  params: Promise<{ slug: string }>;
}

function renderContent(content: string | null) {
  if (!content) {
    return null;
  }

  return content.split("\n").map((line, index) => {
    const trimmed = line.trim();
    const imageMatch = /^!\[(.*)\]\((.*)\)$/.exec(trimmed);

    if (imageMatch) {
      const altText = imageMatch[1] || "Image";
      const imageUrl = imageMatch[2];

      return (
        <img
          key={`image-${index}`}
          src={imageUrl}
          alt={altText}
          className="my-4 rounded-lg border border-gray-200"
        />
      );
    }

    return <p key={`line-${index}`}>{line}</p>;
  });
}
export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return {
    title: post?.title || "Bài viết",
    description: post?.excerpt || "",
  };
}
export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select(
      `
 *,
 profiles (
 display_name,
 avatar_url
 )
 `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error || !post) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: likesCount } = await supabase
    .from("likes")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", post.id);

  let hasLiked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from("likes")
      .select("user_id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle();

    hasLiked = !!likeRow;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-gray-500">
            <span>Bởi {post.profiles?.display_name || "Ẩn danh"}</span>
            <span>•</span>
            <time>
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </time>
          </div>
          <div className="mt-4">
            <LikeButton
              postId={post.id}
              initialCount={likesCount ?? 0}
              initialLiked={hasLiked}
              userId={user?.id ?? null}
            />
          </div>
        </header>
        <div className="prose prose-lg max-w-none">
          {/* Render markdown content */}
          {renderContent(post.content)}
        </div>
      </article>
    </main>
  );
}
