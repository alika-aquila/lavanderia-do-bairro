"use client";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { User, Package, RefreshCw, LogOut, ChevronRight } from "lucide-react";
import { DuckIcon } from "@/components/ui/duck-icon";

const NAV = [
  { label: "Meus dados",   href: "/client/dados",       icon: User },
  { label: "Meus pedidos", href: "/client",              icon: Package },
  { label: "Recorrência",  href: "/client/recorrencias", icon: RefreshCw },
];

export function ClientSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const fullName = session?.user?.name ?? "";

  return (
    <aside className="w-56 shrink-0">
      {/* User greeting */}
      <div className="mb-6 border-b border-gray-200 pb-5">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 ring-2 ring-white ring-offset-1 shadow-sm">
          <DuckIcon className="h-8 w-8 text-indigo-600" />
        </div>
        <p className="text-sm text-gray-500">Olá,</p>
        <p className="text-lg font-bold leading-tight text-gray-900">
          {fullName ? `${fullName}.` : "Carregando..."}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/client" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={[
                "group flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition",
                active
                  ? "border-l-2 border-indigo-600 bg-gray-50 pl-[10px] text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              ].join(" ")}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                {label}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
            </Link>
          );
        })}

        <div className="my-3 border-t border-gray-100" />

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="group flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-red-500"
        >
          <span className="flex items-center gap-3">
            <LogOut className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-red-400" />
            Sair da conta
          </span>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </button>
      </nav>
    </aside>
  );
}
