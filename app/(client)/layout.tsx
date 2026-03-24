import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DuckIcon } from "@/components/ui/duck-icon";
import { UserMenu } from "@/components/lavanderia/user-menu";
import { SiteFooter } from "@/components/lavanderia/site-footer";
import { ClientSidebar } from "@/components/lavanderia/client-sidebar";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/client");

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <DuckIcon className="h-6 w-6 text-gray-900" />
            <span className="font-bold text-gray-900">Lavô</span>
          </Link>
          <UserMenu />
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-6 py-10">
        <ClientSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <SiteFooter />
    </div>
  );
}
