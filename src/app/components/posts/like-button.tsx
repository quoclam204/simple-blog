"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  userId: string | null;
}

export function LikeButton({
  postId,
  initialCount,
  initialLiked,
  userId,
}: LikeButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }

    if (loading) {
      return;
    }

    setError(null);
    setLoading(true);

    const previousLiked = liked;
    const previousCount = count;
    const nextLiked = !previousLiked;

    setLiked(nextLiked);
    setCount(previousCount + (nextLiked ? 1 : -1));

    try {
      if (nextLiked) {
        const { error: insertError } = await supabase.from("likes").insert({
          post_id: postId,
          user_id: userId,
        });

        if (insertError) {
          throw insertError;
        }
      } else {
        const { error: deleteError } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);

        if (deleteError) {
          throw deleteError;
        }
      }
    } catch (err) {
      setLiked(previousLiked);
      setCount(previousCount);
      if (err instanceof Error) {
        setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      } else {
        setError("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
            liked
              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          } disabled:opacity-60`}
        >
          {liked ? "Bo thich" : "Thich"}
        </button>
        <span className="text-sm text-gray-600">{count} luot thich</span>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
