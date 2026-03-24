import { Suspense } from "react";
import Link from "next/link";
import { DuckIcon } from "@/components/ui/duck-icon";
import { CotacaoWizard } from "@/components/lavanderia/cotacao-wizard";
import { UserMenu } from "@/components/lavanderia/user-menu";

export default function CotacaoPage() {
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

      <main className="mx-auto max-w-4xl px-6 pb-12 pt-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Faça sua cotação</h1>
          <p className="mt-2 text-gray-500">
            Selecione os itens e compare os preços por frequência de lavagem.
          </p>
        </div>
        <Suspense>
          <CotacaoWizard />
        </Suspense>
      </main>
    </div>
  );
}
