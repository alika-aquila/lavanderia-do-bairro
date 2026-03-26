"use client";

import { useSession } from "next-auth/react";
import { Search, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export function TopHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-[#E5E9EB] bg-white px-6">
      {/* Criar Novo Pedido */}
      <Link
        href="/admin/novo-pedido"
        className="flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Criar Novo Pedido
      </Link>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA6AC]" />
        <input
          type="text"
          placeholder="Buscar por cliente ou nº do pedido…"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={handleSearch}
          className="h-9 w-full rounded-lg border border-[#DDE2E4] bg-white pl-9 pr-3 text-sm text-[#252C32] placeholder:text-[#9AA6AC] focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Employee name + avatar */}
      {session?.user && (
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-[#252C32]">
            {session.user.name?.split(" ")[0] ?? "Funcionário"}
          </span>
          <Avatar className="h-8 w-8 border border-black/10">
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
        </div>
      )}
    </header>
  );
}
