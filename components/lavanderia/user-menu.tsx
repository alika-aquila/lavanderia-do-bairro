"use client";
import { useSession, signOut } from "next-auth/react";
import { DuckIcon } from "@/components/ui/duck-icon";
import Link from "next/link";
import { LogOut, Package, RefreshCw, User } from "lucide-react";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-100" />;

  if (!session?.user) {
    return (
      <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
        Já tem conta? Entrar
      </Link>
    );
  }

  const firstName = session.user.name?.split(" ")[0] ?? "você";

  return (
    <div className="group relative">
      {/* Trigger: name first, then duck */}
      <button className="flex cursor-pointer items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Olá, {firstName}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-indigo-50 shadow-sm ring-1 ring-gray-200">
          <DuckIcon className="h-5 w-5 text-indigo-600" />
        </div>
      </button>

      {/* Dropdown */}
      <div className="invisible absolute right-0 top-full z-50 mt-2 w-48 origin-top-right scale-95 rounded-xl border border-gray-100 bg-white py-1 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:scale-100 group-hover:opacity-100">
        <Link
          href="/client"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Package className="h-4 w-4 text-gray-400" />
          Meus Pedidos
        </Link>
        <Link
          href="/client/recorrencias"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 text-gray-400" />
          Recorrência
        </Link>
        <Link
          href="/client/dados"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <User className="h-4 w-4 text-gray-400" />
          Meus Dados
        </Link>
        <div className="my-1 border-t border-gray-100" />
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}
