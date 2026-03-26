"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, History, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DuckIcon } from "@/components/ui/duck-icon";

const NAV_ITEMS = [
  {
    label: "Pedidos Ativos",
    href: "/admin/dashboard",
    icon: ClipboardList,
  },
  {
    label: "Histórico de Pedidos",
    href: "/admin/historico",
    icon: History,
  },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-[#E5E9EB] bg-[#F6F8F9]">
      {/* Brand header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-5">
        <DuckIcon className="h-4 w-4 text-indigo-600" />
        <span className="text-base font-bold text-gray-900">Lavô</span>
        <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
          Funcionários
        </span>
      </div>

      <div className="mx-4 h-px bg-[#E5E9EB]" />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-4 pt-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm tracking-[-0.084px] transition-colors ${
                isActive
                  ? "bg-[#D7EDFF] font-semibold text-[#0E73F6]"
                  : "font-normal text-[#252C32] hover:bg-[#E5E9EB]"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="leading-6">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {session?.user && (
        <div className="border-t border-[#E5E9EB] px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={session.user.image || ""}
                alt={session.user.name || ""}
              />
              <AvatarFallback className="bg-[#D7EDFF] text-xs font-semibold text-[#0452C8]">
                {session.user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "F"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-[#252C32]">
                {session.user.name}
              </span>
              <span className="truncate text-xs text-[#84919A]">
                {session.user.email}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="shrink-0 rounded-md p-1 text-[#84919A] hover:bg-[#E5E9EB] hover:text-[#252C32]"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
