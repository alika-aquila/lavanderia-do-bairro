import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { TrialBanner } from "@/components/layout/trial-banner";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "FUNCIONARIO") {
    redirect("/admin/login");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white font-['Inter',sans-serif]">
      <TrialBanner />
      <TopHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-white">{children}</main>
      </div>
    </div>
  );
}
