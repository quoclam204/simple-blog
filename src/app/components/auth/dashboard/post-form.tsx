"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import { Post, PostStatus } from "@/types/database";
interface PostFormProps {
  post?: Post;
}
export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!post;
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [status, setStatus] = useState<PostStatus>(post?.status || "draft");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async () => {
    setUploadError(null);

    if (!imageFile) {
      setUploadError("Vui lòng chọn ảnh trước khi upload.");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUploadError("Bạn cần đăng nhập để upload ảnh.");
        return;
      }

      const safeFileName = imageFile.name.replace(/\s+/g, "-");
      const filePath = `${user.id}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      setUploadedUrl(publicUrl);
      setContent((prev) => {
        const trimmed = prev.trimEnd();
        const separator = trimmed.length > 0 ? "\n\n" : "";
        return `${trimmed}${separator}![${imageFile.name}](${publicUrl})\n`;
      });
      setImageFile(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUploadError(err.message || "Upload ảnh thất bại.");
      } else {
        setUploadError("Upload ảnh thất bại.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Bạn cần đăng nhập để thực hiện thao tác này");
        return;
      }
      const postData = {
        title,
        content,
        excerpt,
        status,
        author_id: user.id,
        published_at: status === "published" ? new Date().toISOString() : null,
      };
      if (isEditing) {
        // Update existing post
        const { error } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", post.id);
        if (error) throw error;
      } else {
        // Create new post
        const { error } = await supabase.from("posts").insert(postData);
        if (error) throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
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
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium
text-gray-700"
        >
          Tiêu đề <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300
rounded-md shadow-sm focus:outline-none focus:ring-blue-500
focus:border-blue-500"
          placeholder="Nhập tiêu đề bài viết"
        />
      </div>
      <div>
        <label
          htmlFor="excerpt"
          className="block text-sm font-medium
text-gray-700"
        >
          Tóm tắt
        </label>
        <input
          id="excerpt"
          type="text"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300
rounded-md shadow-sm focus:outline-none focus:ring-blue-500
focus:border-blue-500"
          placeholder="Mô tả ngắn về bài viết (hiển thị trong danh
sách)"
        />
      </div>
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium
text-gray-700"
        >
          Nội dung
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          className="mt-1 block w-full px-3 py-2 border border-gray-300
rounded-md shadow-sm focus:outline-none focus:ring-blue-500
focus:border-blue-500 font-mono"
          placeholder="Viết nội dung bài viết của bạn..."
        />
        <p className="mt-1 text-xs text-gray-500">Hỗ trợ Markdown</p>
      </div>
      <div>
        <label
          htmlFor="postImage"
          className="block text-sm font-medium text-gray-700"
        >
          Ảnh bài viết
        </label>
        <input
          id="postImage"
          type="file"
          accept="image/*"
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-gray-600"
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={handleImageUpload}
            disabled={uploading || !imageFile}
            className="px-3 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Đang upload..." : "Upload và chèn ảnh"}
          </button>
          {uploadedUrl ? (
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Xem ảnh đã upload
            </a>
          ) : null}
        </div>
        {uploadError && (
          <p className="mt-2 text-sm text-red-500">{uploadError}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium
text-gray-700"
        >
          Trạng thái
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as PostStatus)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300
rounded-md shadow-sm focus:outline-none focus:ring-blue-500
focus:border-blue-500"
        >
          <option value="draft">Bản nháp</option>
          <option value="published">Xuất bản</option>
        </select>
      </div>
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md
hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo bài viết"}
        </button>
      </div>
    </form>
  );
}
