"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CATALOGO, RECORRENCIA_LABELS, calcularTotal, type Recorrencia } from "@/lib/catalogo";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DuckIcon } from "@/components/ui/duck-icon";
import { CotacaoProgress } from "@/components/lavanderia/cotacao-progress";

type Step = 1 | 2 | 3;
type QuantidadeMap = Record<string, number>;

const RECORRENCIAS: Recorrencia[] = ["AVULSO", "SEMANAL", "QUINZENAL", "MENSAL"];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const RECORRENCIA_INFO: Record<Recorrencia, { emoji: string; descricao: string }> = {
  AVULSO:   { emoji: "🧺", descricao: "Sem compromisso" },
  SEMANAL:  { emoji: "📅", descricao: "Toda semana" },
  QUINZENAL:{ emoji: "📆", descricao: "A cada 15 dias" },
  MENSAL:   { emoji: "🗓️", descricao: "Uma vez ao mês" },
};

export function CotacaoWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [categoriaSlug, setCategoriaSlug] = useState<string | null>(null);
  const [quantidades, setQuantidades] = useState<QuantidadeMap>({});

  const categoriaParam = searchParams.get("categoria");

  useEffect(() => {
    if (categoriaParam && CATALOGO.some((c) => c.slug === categoriaParam)) {
      setCategoriaSlug(categoriaParam);
      setQuantidades({});
      setStep(2);
      return;
    }
    try {
      const saved = sessionStorage.getItem("cotacao-wizard");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.categoriaSlug) setCategoriaSlug(parsed.categoriaSlug);
        if (parsed.quantidades) setQuantidades(parsed.quantidades);
        if (parsed.step) setStep(parsed.step);
      }
    } catch {
      // ignore
    }
  }, [categoriaParam]);

  useEffect(() => {
    // Don't overwrite saved state with blank defaults on initial mount
    if (categoriaSlug === null) return;
    try {
      sessionStorage.setItem(
        "cotacao-wizard",
        JSON.stringify({ categoriaSlug, quantidades, step })
      );
    } catch {
      // ignore
    }
  }, [categoriaSlug, quantidades, step]);

  const categoria = CATALOGO.find((c) => c.slug === categoriaSlug);

  const itensComQuantidade = categoria
    ? categoria.itens.filter((item) => (quantidades[item.slug] ?? 0) > 0)
    : [];

  function handleContratar(recorrencia: Recorrencia) {
    const data = {
      categoriaSlug,
      itens: itensComQuantidade.map((item) => ({
        itemSlug: item.slug,
        quantidade: quantidades[item.slug],
      })),
      recorrencia,
    };
    try {
      // Save cotacao data — preserve cotacao-wizard so back button restores step 3
      sessionStorage.setItem("cotacao-selecionada", JSON.stringify(data));
    } catch {
      // ignore
    }
    router.push("/cliente/novo-pedido");
  }

  // ─── Step 1: Category selection ───────────────────────────────────────────
  if (step === 1) {
    return (
      <div>
        <CotacaoProgress currentStep={1} />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Passo 1 — Escolha a Categoria</h2>
        <p className="mb-8 text-gray-500">Selecione o tipo de roupa que deseja lavar.</p>
        <div className="flex flex-col gap-3">
          {CATALOGO.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                setCategoriaSlug(cat.slug);
                setQuantidades({});
                setStep(2);
              }}
              className="flex h-[120px] w-full cursor-pointer items-center gap-6 rounded-xl border-2 border-gray-200 bg-white px-6 text-left transition hover:scale-[0.99] hover:border-indigo-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <DuckIcon className="h-10 w-10 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{cat.nome}</h3>
                <p className="mt-0.5 text-sm text-gray-500">{cat.itens.length} itens disponíveis</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Step 2: Items and quantities ─────────────────────────────────────────
  if (step === 2 && categoria) {
    const hasAnyItem = categoria.itens.some((item) => (quantidades[item.slug] ?? 0) > 0);

    return (
      <div>
        <CotacaoProgress currentStep={2} />
        <button
          onClick={() => setStep(1)}
          className="mb-6 flex cursor-pointer items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Passo 2 — {categoria.nome}</h2>
        <p className="mb-8 text-gray-500">Informe a quantidade de cada item.</p>

        <div className="divide-y rounded-xl border bg-white">
          {categoria.itens.map((item) => (
            <div key={item.slug} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-gray-900">{item.nome}</p>
                <p className="text-sm text-gray-500">
                  A partir de {formatBRL(Math.min(...Object.values(item.precos)))}/peça
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setQuantidades((prev) => ({
                      ...prev,
                      [item.slug]: Math.max(0, (prev[item.slug] ?? 0) - 1),
                    }))
                  }
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  disabled={(quantidades[item.slug] ?? 0) === 0}
                >
                  −
                </button>
                <span className="w-8 text-center text-lg font-semibold text-gray-900">
                  {quantidades[item.slug] ?? 0}
                </span>
                <button
                  onClick={() =>
                    setQuantidades((prev) => ({
                      ...prev,
                      [item.slug]: (prev[item.slug] ?? 0) + 1,
                    }))
                  }
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          {!hasAnyItem ? (
            <p className="text-sm text-gray-400">
              Adicione ao menos um item para ver os preços.
            </p>
          ) : (
            <span />
          )}
          <Button
            disabled={!hasAnyItem}
            onClick={() => setStep(3)}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700"
          >
            Ver preços e recorrências
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Step 3: Recorrência cards ────────────────────────────────────────────
  if (step === 3 && categoria) {
    return (
      <div>
        <CotacaoProgress currentStep={3} />
        <button
          onClick={() => setStep(2)}
          className="mb-6 flex cursor-pointer items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Passo 3 — Escolha a Recorrência</h2>

        {/* Summary header */}
        <div className="mb-8 rounded-xl border bg-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <DuckIcon className="h-4 w-4 text-indigo-600" />
              <span className="font-semibold text-gray-900">{categoria.nome}</span>
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Entrega estimada:</span>{" "}
              3 dias úteis após a coleta
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
              {itensComQuantidade.map((item) => (
                <span key={item.slug}>
                  {item.nome}{" "}
                  <span className="font-semibold text-gray-800">×{quantidades[item.slug]}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Recorrência cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RECORRENCIAS.map((rec) => {
            const info = RECORRENCIA_INFO[rec];
            const total = calcularTotal(
              itensComQuantidade.map((item) => ({
                itemSlug: item.slug,
                categoriaSlug: categoria.slug,
                quantidade: quantidades[item.slug] ?? 0,
              })),
              rec
            );
            return (
              <div
                key={rec}
                className="flex flex-col items-center rounded-xl border-2 border-gray-200 bg-white p-6 text-center transition hover:border-indigo-400 hover:shadow-sm"
              >
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-4xl">
                  {info.emoji}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{RECORRENCIA_LABELS[rec]}</h3>
                <p className="mb-2 text-xs text-gray-400">{info.descricao}</p>
                <p className="mb-6 text-2xl font-bold text-indigo-600">{formatBRL(total)}</p>
                <Button
                  size="sm"
                  className="mt-auto w-full cursor-pointer bg-indigo-600 hover:scale-[0.97] hover:bg-indigo-700"
                  onClick={() => handleContratar(rec)}
                >
                  Contratar
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
