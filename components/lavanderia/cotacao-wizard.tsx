"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { CATALOGO, RECORRENCIA_LABELS, calcularTotal, type Recorrencia } from "@/lib/catalogo";
import { ArrowLeft, ArrowRight, WashingMachine } from "lucide-react";

type Step = 1 | 2 | 3;

type QuantidadeMap = Record<string, number>;

const RECORRENCIAS: Recorrencia[] = ["AVULSO", "SEMANAL", "BISSEMANAL", "MENSAL"];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CotacaoWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>(1);
  const [categoriaSlug, setCategoriaSlug] = useState<string | null>(null);
  const [quantidades, setQuantidades] = useState<QuantidadeMap>({});

  // Restore state from sessionStorage on mount
  useEffect(() => {
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
  }, []);

  // Persist to sessionStorage on change
  useEffect(() => {
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
      sessionStorage.setItem("cotacao-selecionada", JSON.stringify(data));
      // Clear wizard state
      sessionStorage.removeItem("cotacao-wizard");
    } catch {
      // ignore
    }

    if (!session?.user) {
      router.push("/login?callbackUrl=/cliente/novo-pedido");
    } else {
      router.push("/cliente/novo-pedido");
    }
  }

  // Step 1: Category selection
  if (step === 1) {
    return (
      <div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Passo 1 de 3 — Escolha a categoria</h2>
        <p className="mb-8 text-gray-500">Selecione o tipo de roupa que deseja lavar.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {CATALOGO.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                setCategoriaSlug(cat.slug);
                setQuantidades({});
                setStep(2);
              }}
              className="rounded-xl border-2 border-gray-200 bg-white p-6 text-center transition hover:border-indigo-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50">
                <WashingMachine className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{cat.nome}</h3>
              <p className="mt-1 text-sm text-gray-500">{cat.itens.length} itens disponíveis</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Items and quantities
  if (step === 2 && categoria) {
    const hasAnyItem = categoria.itens.some((item) => (quantidades[item.slug] ?? 0) > 0);

    return (
      <div>
        <button
          onClick={() => setStep(1)}
          className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Passo 2 de 3 — {categoria.nome}
        </h2>
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
                  className="flex h-8 w-8 items-center justify-center rounded-full border text-gray-600 hover:bg-gray-100 disabled:opacity-40"
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
                  className="flex h-8 w-8 items-center justify-center rounded-full border text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {!hasAnyItem && (
          <p className="mt-4 text-center text-sm text-gray-400">
            Adicione ao menos um item para ver os preços.
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            disabled={!hasAnyItem}
            onClick={() => setStep(3)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Ver preços e recorrências
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Price comparison table
  if (step === 3 && categoria) {
    return (
      <div>
        <button
          onClick={() => setStep(2)}
          className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Passo 3 de 3 — Escolha a recorrência
        </h2>
        <p className="mb-8 text-gray-500">
          Compare os preços e escolha o plano ideal para você. Planos recorrentes têm desconto progressivo.
        </p>

        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Item</th>
                {RECORRENCIAS.map((rec) => (
                  <th key={rec} className="px-4 py-3 text-center font-medium text-gray-600">
                    {RECORRENCIA_LABELS[rec]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {itensComQuantidade.map((item) => (
                <tr key={item.slug}>
                  <td className="px-4 py-3 text-gray-900">
                    {item.nome}{" "}
                    <span className="text-gray-400">×{quantidades[item.slug]}</span>
                  </td>
                  {RECORRENCIAS.map((rec) => (
                    <td key={rec} className="px-4 py-3 text-center text-gray-700">
                      {formatBRL(item.precos[rec] * (quantidades[item.slug] ?? 0))}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t bg-indigo-50 font-semibold">
                <td className="px-4 py-3 text-gray-900">Total</td>
                {RECORRENCIAS.map((rec) => (
                  <td key={rec} className="px-4 py-3 text-center text-indigo-700">
                    {formatBRL(
                      calcularTotal(
                        itensComQuantidade.map((item) => ({
                          itemSlug: item.slug,
                          categoriaSlug: categoria.slug,
                          quantidade: quantidades[item.slug] ?? 0,
                        })),
                        rec
                      )
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t">
                <td className="px-4 py-3 text-gray-500 text-xs">Entrega estimada</td>
                {RECORRENCIAS.map((rec) => {
                  const dias = { AVULSO: 3, SEMANAL: 5, BISSEMANAL: 5, MENSAL: 7 }[rec];
                  return (
                    <td key={rec} className="px-4 py-3 text-center text-xs text-gray-500">
                      {dias} dias úteis
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-4 py-4"></td>
                {RECORRENCIAS.map((rec) => (
                  <td key={rec} className="px-4 py-4 text-center">
                    <Button
                      size="sm"
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => handleContratar(rec)}
                    >
                      Contratar
                    </Button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
