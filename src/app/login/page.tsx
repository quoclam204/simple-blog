import { LoginForm } from "@/app/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  // 1. Đổi kiểu dữ liệu thành Promise
  searchParams: Promise<{ message?: string }>; 
}) {
  // 2. Dùng await để giải nén dữ liệu
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Đăng nhập</h2>
          <p className="mt-2 text-gray-600">
            Đăng nhập để quản lý blog của bạn
          </p>
        </div>

        {/* 3. Dùng biến params đã được giải nén */}
        {params?.message && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
            {params.message}
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  );
}