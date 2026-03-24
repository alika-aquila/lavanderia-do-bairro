"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { DuckIcon } from "@/components/ui/duck-icon";
import {
  CATALOGO,
  RECORRENCIA_LABELS,
  calcularEstimativaEntrega,
  calcularTotal,
  type Recorrencia,
} from "@/lib/catalogo";
import { CotacaoProgress } from "@/components/lavanderia/cotacao-progress";

type CotacaoSelecionada = {
  categoriaSlug: string;
  itens: { itemSlug: string; quantidade: number }[];
  recorrencia: Recorrencia;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "Quarta-feira, 25/03/2026" */
function formatDelivery(date: Date) {
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateStr = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dateStr}`;
}

// ─── Calendly-style calendar ─────────────────────────────────────────────────
function CalendlyCalendar({
  selectedDate,
  selectedTurno,
  onDateChange,
  onTurnoChange,
  estimativa,
}: {
  selectedDate: Date | null;
  selectedTurno: "manha" | "tarde" | null;
  onDateChange: (date: Date) => void;
  onTurnoChange: (turno: "manha" | "tarde") => void;
  estimativa: Date | null;
}) {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startDow = firstDay.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(viewYear, viewMonth, d));
  }

  function isSelectable(date: Date) {
    if (date <= today) return false;
    const dow = date.getDay();
    return dow !== 0 && dow !== 6;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  // "Março 2026" — no "de"
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString("pt-BR", { month: "long" });
  const monthLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${viewYear}`;

  return (
    <div className="flex flex-col gap-8 sm:flex-row">
      {/* ── Calendar grid ── */}
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-gray-900">{monthLabel}</span>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="py-1 text-xs font-medium text-gray-400">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={`pad-${i}`} />;
            const selectable = isSelectable(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            return (
              <button
                key={date.toISOString()}
                disabled={!selectable}
                onClick={() => selectable && onDateChange(date)}
                className={[
                  "flex aspect-square items-center justify-center rounded-full text-sm font-medium transition",
                  isSelected ? "bg-indigo-600 text-white" :
                  selectable ? "cursor-pointer text-gray-900 hover:bg-indigo-50" :
                  "cursor-default text-gray-300",
                ].join(" ")}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Time slots ── */}
      <div className="w-full sm:w-52">
        {selectedDate ? (
          <div>
            <p className="mb-3 text-sm font-semibold capitalize text-gray-700">
              {selectedDate.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </p>
            <div className="flex flex-col gap-2">
              {(["manha", "tarde"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onTurnoChange(t)}
                  className={[
                    "cursor-pointer rounded-lg border px-4 py-3 text-sm font-medium transition",
                    selectedTurno === t
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-gray-200 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50",
                  ].join(" ")}
                >
                  {t === "manha" ? "Manhã (8 – 12h)" : "Tarde (14 – 18h)"}
                </button>
              ))}
            </div>

            {selectedTurno && estimativa && (
              <div className="mt-4 rounded-lg bg-indigo-50 p-3">
                <p className="text-sm font-semibold text-indigo-700">Estimativa de entrega:</p>
                <p className="text-sm text-indigo-700">{formatDelivery(estimativa)}</p>
                <p className="mt-1 text-xs text-indigo-500">
                  Você receberá um e-mail quando o pedido estiver pronto para retirada.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-400">
            Selecione um dia
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NovoPedidoPage() {
  const router = useRouter();
  const { status } = useSession();
  const [cotacao, setCotacao] = useState<CotacaoSelecionada | null>(null);
  const [diaAgendado, setDiaAgendado] = useState<Date | null>(null);
  const [turno, setTurno] = useState<"manha" | "tarde" | null>(null);

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

  const itensDetalhados =
    cotacao && categoria
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

  function handleContinuar() {
    if (!cotacao || !diaAgendado || !turno) return;

    // If not logged in, save state and redirect to login first
    if (status === "unauthenticated") {
      try {
        sessionStorage.setItem(
          "cotacao-selecionada",
          JSON.stringify({
            ...cotacao,
            diaAgendado: diaAgendado.toISOString(),
            turno,
          })
        );
      } catch {
        // ignore
      }
      router.push("/login?callbackUrl=/cliente/pagamento");
      return;
    }

    try {
      sessionStorage.setItem(
        "cotacao-selecionada",
        JSON.stringify({
          ...cotacao,
          diaAgendado: diaAgendado.toISOString(),
          turno,
        })
      );
    } catch {
      // ignore
    }
    router.push("/cliente/pagamento");
  }

  if (!cotacao) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <CotacaoProgress currentStep={4} />

      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>

      <h1 className="mb-8 text-2xl font-bold text-gray-900">Passo 4 — Agendamento</h1>

      {/* ── Order summary ── */}
      <div className="mb-8 rounded-xl border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <DuckIcon className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Resumo do pedido</h2>
        </div>

        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">Categoria</span>
          <span className="font-medium text-gray-900">{categoria?.nome}</span>
        </div>
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">Recorrência</span>
          <span className="font-medium text-gray-900">
            {RECORRENCIA_LABELS[cotacao.recorrencia]}
          </span>
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

      {/* ── Calendly calendar ── */}
      <div className="mb-8 rounded-xl border bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Escolha o dia e turno</h2>
        </div>
        <p className="mb-6 text-sm text-gray-500">
          Selecione o dia que você vai trazer as roupas à lavanderia.
        </p>
        <CalendlyCalendar
          selectedDate={diaAgendado}
          selectedTurno={turno}
          onDateChange={(date) => { setDiaAgendado(date); setTurno(null); }}
          onTurnoChange={setTurno}
          estimativa={estimativaEntrega}
        />
      </div>

      <Button
        size="lg"
        className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700"
        disabled={!diaAgendado || !turno || status === "loading"}
        onClick={handleContinuar}
      >
        Continuar para pagamento
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
