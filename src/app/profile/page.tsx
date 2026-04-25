import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { ProfileForm } from "@/app/components/auth/profile/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const initialDisplayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "";
  const initialAvatarUrl =
    profile?.avatar_url ?? user.user_metadata?.avatar_url ?? "";

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Hồ sơ của tôi</h1>
          <p className="text-gray-600 mt-2">
            Cập nhật tên hiển thị và ảnh đại diện để mọi người nhận ra bạn.
          </p>
        </div>

        <ProfileForm
          userId={user.id}
          initialDisplayName={initialDisplayName}
          initialAvatarUrl={initialAvatarUrl}
        />
      </div>
    </main>
  );
}
