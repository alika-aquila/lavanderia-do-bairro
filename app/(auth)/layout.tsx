import Link from "next/link";
import { DuckIcon } from "@/components/ui/duck-icon";
import { UserMenu } from "@/components/lavanderia/user-menu";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <DuckIcon className="h-6 w-6 text-gray-900" />
            <span className="font-bold text-gray-900">Lavô</span>
          </Link>
          <UserMenu />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
