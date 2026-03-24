"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  CreditCard,
  QrCode,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { DuckIcon } from "@/components/ui/duck-icon";
import Link from "next/link";
import {
  CATALOGO,
  RECORRENCIA_LABELS,
  calcularTotal,
  type Recorrencia,
} from "@/lib/catalogo";
import { CotacaoProgress } from "@/components/lavanderia/cotacao-progress";

type CotacaoSelecionada = {
  categoriaSlug: string;
  itens: { itemSlug: string; quantidade: number }[];
  recorrencia: Recorrencia;
  diaAgendado: string;
  turno: "manha" | "tarde";
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const RECORRENCIA_PERIODO: Record<Recorrencia, string> = {
  AVULSO: "avulso",
  SEMANAL: "por semana",
  QUINZENAL: "a cada 15 dias",
  MENSAL: "por mês",
};

const isDev = process.env.NODE_ENV === "development";

// ─── Fake PIX QR Code visual ─────────────────────────────────────────────────
function PixQRCode({ valor }: { valor: number }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Visual QR placeholder */}
      <div className="relative flex h-48 w-48 items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-3">
        <div className="grid h-full w-full grid-cols-7 grid-rows-7 gap-[2px] opacity-80">
          {Array.from({ length: 49 }).map((_, i) => {
            const corners = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48];
            const mid = [24];
            const filled = corners.includes(i) || mid.includes(i) || (i % 7 !== 0 && i % 3 === 0);
            return (
              <div
                key={i}
                className={`rounded-[1px] ${filled ? "bg-gray-900" : "bg-transparent"}`}
              />
            );
          })}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-md bg-white px-2 py-1">
            <p className="text-[9px] font-bold text-gray-500">EXEMPLO</p>
          </div>
        </div>
      </div>

      <div className="w-full rounded-lg bg-gray-50 px-4 py-3 text-center">
        <p className="mb-1 text-xs text-gray-500">Chave PIX (exemplo)</p>
        <p className="break-all font-mono text-xs text-gray-800">
          00020126580014BR.GOV.BCB.PIX0136lavo@lavanderia.com.br520400005303986540{valor.toFixed(2)}5802BR5925Lavô Serviços de Lavanderia
        </p>
      </div>

      <p className="text-center text-sm text-gray-500">
        Após o pagamento, seu pedido será confirmado automaticamente em até 5 minutos.
      </p>
    </div>
  );
}

// ─── Credit card form ─────────────────────────────────────────────────────────
function CartaoForm({
  cardData,
  onChange,
}: {
  cardData: { numero: string; nome: string; validade: string; cvv: string };
  onChange: (field: string, value: string) => void;
}) {
  function formatNumero(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatValidade(v: string) {
    return v.replace(/\D/g, "").slice(0, 4).replace(/^(.{2})(.+)/, "$1/$2");
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="numero">Número do cartão</Label>
        <Input
          id="numero"
          placeholder="0000 0000 0000 0000"
          value={cardData.numero}
          onChange={(e) => onChange("numero", formatNumero(e.target.value))}
          maxLength={19}
          className="mt-1 font-mono"
        />
      </div>
      <div>
        <Label htmlFor="nome">Nome no cartão</Label>
        <Input
          id="nome"
          placeholder="NOME SOBRENOME"
          value={cardData.nome}
          onChange={(e) => onChange("nome", e.target.value.toUpperCase())}
          className="mt-1 uppercase"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="validade">Validade</Label>
          <Input
            id="validade"
            placeholder="MM/AA"
            value={cardData.validade}
            onChange={(e) => onChange("validade", formatValidade(e.target.value))}
            maxLength={5}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            placeholder="000"
            value={cardData.cvv}
            onChange={(e) => onChange("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
            maxLength={4}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PagamentoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cotacao, setCotacao] = useState<CotacaoSelecionada | null>(null);
  const [payMethod, setPayMethod] = useState<"pix" | "cartao">("cartao");
  const [cardData, setCardData] = useState({ numero: "", nome: "", validade: "", cvv: "" });
  const [consentRecorrente, setConsentRecorrente] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("cotacao-selecionada");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.diaAgendado || !parsed.turno) {
          router.push("/cliente/novo-pedido");
          return;
        }
        setCotacao(parsed);
        // Default to PIX if avulso
        if (parsed.recorrencia === "AVULSO") setPayMethod("pix");
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

  const isRecorrente = cotacao?.recorrencia !== "AVULSO";
  const pixDisabled = isRecorrente;

  function autoFillDev() {
    setCardData({ numero: "0000 0000 0000 0000", nome: "TESTE USUARIO", validade: "01/29", cvv: "000" });
    if (isRecorrente) setConsentRecorrente(true);
    setPayMethod("cartao");
  }

  async function handlePagar() {
    if (!cotacao) return;
    setError(null);

    if (isRecorrente && !consentRecorrente) {
      setError("Confirme a autorização da cobrança recorrente antes de continuar.");
      return;
    }
    if (payMethod === "cartao") {
      if (!cardData.numero || !cardData.nome || !cardData.validade || !cardData.cvv) {
        setError("Preencha todos os campos do cartão.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoriaSlug: cotacao.categoriaSlug,
          itens: cotacao.itens,
          recorrencia: cotacao.recorrencia,
          diaAgendado: cotacao.diaAgendado,
          turno: cotacao.turno,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar pedido.");
        setIsLoading(false);
        return;
      }

      const pedido = await res.json();

      const confirmRes = await fetch(`/api/pedidos/${pedido.id}/confirmar`, { method: "POST" });
      if (!confirmRes.ok) {
        setError("Erro ao confirmar pagamento.");
        setIsLoading(false);
        return;
      }

      sessionStorage.removeItem("cotacao-selecionada");
      sessionStorage.removeItem("cotacao-wizard");
      router.push(`/cliente/confirmado/${pedido.id}`);
    } catch {
      setError("Erro inesperado. Tente novamente.");
      setIsLoading(false);
    }
  }

  if (!cotacao) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // ── Unauthenticated: ask for Google login ──────────────────────────────────
  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <CotacaoProgress currentStep={5} />
        <div className="mb-8">
          <Link href="/cliente/novo-pedido" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            Voltar para agendamento
          </Link>
        </div>
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Passo 5 — Pagamento</h1>
        <div className="rounded-xl border bg-white p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Lock className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Entre para finalizar o pedido
          </h2>
          <p className="mb-8 text-gray-500">
            Para confirmar e pagar, você precisa entrar com sua conta Google.
            É rápido e seguro.
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/cliente/pagamento" })}
            className="mx-auto flex w-full max-w-sm cursor-pointer items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>
          <p className="mt-4 text-xs text-gray-400">
            Sua seleção está salva e você voltará automaticamente para esta etapa.
          </p>
        </div>
      </div>
    );
  }

  // ── Authenticated: payment form ────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <CotacaoProgress currentStep={5} />

      <div className="mb-8">
        <Link href="/cliente/novo-pedido" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Voltar para agendamento
        </Link>
      </div>

      <h1 className="mb-8 text-2xl font-bold text-gray-900">Passo 5 — Pagamento</h1>

      {/* ── Order summary ── */}
      <div className="mb-6 rounded-xl border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <DuckIcon className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Resumo do pedido</h2>
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
            <span className="text-indigo-700">
              Total{isRecorrente && ` (${RECORRENCIA_PERIODO[cotacao.recorrencia]})`}
            </span>
            <span className="text-indigo-700">{formatBRL(valorTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── Payment method tabs ── */}
      <div className="mb-6 rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Forma de pagamento</h2>

        <div className="mb-6 flex gap-3">
          {/* PIX tab */}
          <button
            onClick={() => !pixDisabled && setPayMethod("pix")}
            disabled={pixDisabled}
            title={pixDisabled ? "PIX disponível apenas para pedidos avulsos" : ""}
            className={[
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition",
              payMethod === "pix" && !pixDisabled
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : pixDisabled
                ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                : "border-gray-200 text-gray-600 hover:border-gray-300",
            ].join(" ")}
          >
            <QrCode className="h-4 w-4" />
            PIX
            {pixDisabled && (
              <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
                só avulso
              </span>
            )}
          </button>

          {/* Cartão tab */}
          <button
            onClick={() => setPayMethod("cartao")}
            className={[
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition",
              payMethod === "cartao"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300",
            ].join(" ")}
          >
            <CreditCard className="h-4 w-4" />
            Cartão de crédito
          </button>
        </div>

        {/* PIX content */}
        {payMethod === "pix" && !pixDisabled && <PixQRCode valor={valorTotal} />}

        {/* Card content */}
        {payMethod === "cartao" && (
          <CartaoForm
            cardData={cardData}
            onChange={(field, value) => setCardData((prev) => ({ ...prev, [field]: value }))}
          />
        )}
      </div>

      {/* ── Recurring consent ── */}
      {isRecorrente && (
        <div className={[
          "mb-6 rounded-xl border p-5",
          consentRecorrente ? "border-indigo-200 bg-indigo-50" : "border-amber-200 bg-amber-50",
        ].join(" ")}>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={consentRecorrente}
              onChange={(e) => setConsentRecorrente(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 accent-indigo-600"
            />
            <span className={`text-sm leading-relaxed ${consentRecorrente ? "text-indigo-700" : "text-amber-800"}`}>
              Autorizo a cobrança recorrente de{" "}
              <strong>{formatBRL(valorTotal)}</strong>{" "}
              {RECORRENCIA_PERIODO[cotacao.recorrencia]} pelo serviço de lavanderia Lavô.
              Posso cancelar a qualquer momento.
            </span>
          </label>
        </div>
      )}

      {/* ── Dev mode auto-fill ── */}
      {isDev && (
        <div className="mb-6 rounded-xl border border-dashed border-orange-300 bg-orange-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-orange-700">🛠 Modo desenvolvimento</p>
              <p className="text-xs text-orange-600">
                Preenche todos os campos automaticamente para testar o fluxo.
              </p>
            </div>
            <button
              onClick={autoFillDev}
              className="cursor-pointer rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50"
            >
              Preencher com 0&apos;s
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* ── Pay button ── */}
      <Button
        size="lg"
        className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700"
        disabled={isLoading || (isRecorrente && !consentRecorrente)}
        onClick={handlePagar}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Lock className="mr-2 h-4 w-4" />
        )}
        {payMethod === "pix"
          ? `Confirmar pedido — ${formatBRL(valorTotal)}`
          : `Pagar ${formatBRL(valorTotal)} com cartão`}
      </Button>

      <p className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-400">
        <Lock className="h-3 w-3" />
        Pagamento seguro e criptografado
      </p>
    </div>
  );
}
