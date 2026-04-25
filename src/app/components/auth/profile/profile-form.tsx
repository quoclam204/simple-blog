"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

interface ProfileFormProps {
  userId: string;
  initialDisplayName: string;
  initialAvatarUrl: string;
}

export function ProfileForm({
  userId,
  initialDisplayName,
  initialAvatarUrl,
}: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const trimmedDisplayName = displayName.trim();
      const trimmedAvatarUrl = avatarUrl.trim();

      const { error: updateError } = await supabase.from("profiles").upsert({
        id: userId,
        display_name: trimmedDisplayName ? trimmedDisplayName : null,
        avatar_url: trimmedAvatarUrl ? trimmedAvatarUrl : null,
        updated_at: new Date().toISOString(),
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess("Đã cập nhật hồ sơ.");
      router.refresh();
    } catch (err) {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
          {success}
        </div>
      )}

      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-gray-700"
        >
          Tên hiển thị
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Nguyễn Văn A"
        />
      </div>

      <div>
        <label
          htmlFor="avatarUrl"
          className="block text-sm font-medium text-gray-700"
        >
          Avatar URL
        </label>
        <input
          id="avatarUrl"
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/avatar.png"
        />
      </div>

      {avatarUrl.trim() ? (
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden border border-gray-200">
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="text-sm text-gray-500">Xem trước avatar</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Đang lưu..." : "Cập nhật"}
      </button>
    </form>
  );
}
