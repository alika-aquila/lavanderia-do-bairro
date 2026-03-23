import Link from "next/link";
import { WashingMachine } from "lucide-react";
import { CotacaoWizard } from "@/components/lavanderia/cotacao-wizard";

export default function CotacaoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <WashingMachine className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-gray-900">Lavanderia do Bairro</span>
          </Link>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
            Já tem conta? Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Faça sua cotação</h1>
          <p className="mt-2 text-gray-500">
            Selecione os itens e compare os preços por frequência de lavagem.
          </p>
        </div>
        <CotacaoWizard />
      </main>
    </div>
  );
}
