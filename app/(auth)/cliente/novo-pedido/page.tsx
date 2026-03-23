"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WashingMachine, Loader2, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CATALOGO, RECORRENCIA_LABELS, calcularEstimativaEntrega, calcularTotal, type Recorrencia } from "@/lib/catalogo";

type CotacaoSelecionada = {
  categoriaSlug: string;
  itens: { itemSlug: string; quantidade: number }[];
  recorrencia: Recorrencia;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "long" });
}

function getProximosDias(count: number): Date[] {
  const dias: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let current = new Date(today);
  current.setDate(current.getDate() + 1); // Start from tomorrow

  while (dias.length < count) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Exclude weekends
      dias.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return dias;
}

export default function NovoPedidoPage() {
  const router = useRouter();
  const [cotacao, setCotacao] = useState<CotacaoSelecionada | null>(null);
  const [diaAgendado, setDiaAgendado] = useState<Date | null>(null);
  const [turno, setTurno] = useState<"manha" | "tarde" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dias = getProximosDias(30);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("cotacao-selecionada");
      if (saved) {
        setCotacao(JSON.parse(saved));
      } else {
        router.push("/cotacao");
      }
    } catch {
      router.push("/cotacao");
    }
  }, [router]);

  const categoria = cotacao ? CATALOGO.find((c) => c.slug === cotacao.categoriaSlug) : null;

  const itensDetalhados = cotacao && categoria
    ? cotacao.itens.map(({ itemSlug, quantidade }) => {
        const item = categoria.itens.find((i) => i.slug === itemSlug)!;
        return { item, quantidade };
      })
    : [];

  const valorTotal = cotacao
    ? calcularTotal(
        cotacao.itens.map(({ itemSlug, quantidade }) => ({
          itemSlug,
          categoriaSlug: cotacao.categoriaSlug,
          quantidade,
        })),
        cotacao.recorrencia
      )
    : 0;

  const estimativaEntrega =
    diaAgendado && cotacao
      ? calcularEstimativaEntrega(diaAgendado, cotacao.recorrencia)
      : null;

  async function handleConfirmar() {
    if (!cotacao || !diaAgendado || !turno) return;
    setIsLoading(true);
    setError(null);

    try {
      // Create the pedido
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoriaSlug: cotacao.categoriaSlug,
          itens: cotacao.itens,
          recorrencia: cotacao.recorrencia,
          diaAgendado: diaAgendado.toISOString(),
          turno,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar pedido.");
        setIsLoading(false);
        return;
      }

      const pedido = await res.json();

      // Confirm payment
      const confirmRes = await fetch(`/api/pedidos/${pedido.id}/confirmar`, {
        method: "POST",
      });

      if (!confirmRes.ok) {
        setError("Erro ao confirmar pedido.");
        setIsLoading(false);
        return;
      }

      // Clear session storage
      sessionStorage.removeItem("cotacao-selecionada");

      router.push(`/cliente/confirmado/${pedido.id}`);
    } catch {
      setError("Erro inesperado. Tente novamente.");
      setIsLoading(false);
    }
  }

  if (!cotacao) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <Link href="/cotacao" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Voltar para cotação
        </Link>
      </div>

      <h1 className="mb-8 text-2xl font-bold text-gray-900">Confirmar pedido</h1>

      {/* Order summary */}
      <div className="mb-8 rounded-xl border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <WashingMachine className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Resumo do pedido</h2>
        </div>

        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">Categoria</span>
          <span className="font-medium text-gray-900">{categoria?.nome}</span>
        </div>
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">Recorrência</span>
          <span className="font-medium text-gray-900">{RECORRENCIA_LABELS[cotacao.recorrencia]}</span>
        </div>

        <div className="divide-y rounded-lg border">
          {itensDetalhados.map(({ item, quantidade }) => (
            <div key={item.slug} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-gray-700">
                {item.nome} <span className="text-gray-400">×{quantidade}</span>
              </span>
              <span className="font-medium text-gray-900">
                {formatBRL(item.precos[cotacao.recorrencia] * quantidade)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between bg-indigo-50 px-4 py-3 font-semibold">
            <span className="text-indigo-700">Total</span>
            <span className="text-indigo-700">{formatBRL(valorTotal)}</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="mb-8 rounded-xl border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Escolha o dia e turno</h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Selecione o dia que você vai trazer as roupas à lavanderia.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {dias.slice(0, 20).map((dia) => {
            const isSelected = diaAgendado?.toDateString() === dia.toDateString();
            return (
              <div
                key={dia.toISOString()}
                className={`rounded-lg border p-3 ${isSelected ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
              >
                <p className="mb-2 text-sm font-medium text-gray-900 capitalize">
                  {dia.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDiaAgendado(dia); setTurno("manha"); }}
                    className={`flex-1 rounded py-1.5 text-xs font-medium transition ${
                      isSelected && turno === "manha"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-indigo-100"
                    }`}
                  >
                    Manhã (08h–12h)
                  </button>
                  <button
                    onClick={() => { setDiaAgendado(dia); setTurno("tarde"); }}
                    className={`flex-1 rounded py-1.5 text-xs font-medium transition ${
                      isSelected && turno === "tarde"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-indigo-100"
                    }`}
                  >
                    Tarde (14h–18h)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estimated delivery */}
      {estimativaEntrega && (
        <div className="mb-6 rounded-lg bg-indigo-50 px-5 py-4">
          <p className="text-sm text-indigo-700">
            <span className="font-semibold">Estimativa de entrega:</span>{" "}
            {formatDate(estimativaEntrega)}
          </p>
          <p className="mt-1 text-xs text-indigo-500">
            Você receberá um e-mail quando o pedido estiver pronto para retirada.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        size="lg"
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={!diaAgendado || !turno || isLoading}
        onClick={handleConfirmar}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Confirmar e pagar — {formatBRL(valorTotal)}
      </Button>
    </div>
  );
}
