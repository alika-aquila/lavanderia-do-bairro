import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "FUNCIONARIO") {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">Lavanderia do Bairro</span>
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.user.email}</span>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
