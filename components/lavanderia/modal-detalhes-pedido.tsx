"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { RECORRENCIA_LABELS } from "@/lib/catalogo";
import { toast } from "sonner";

type ItemPedido = {
  id: string;
  itemNome: string;
  categoriaNome: string;
  quantidade: number;
  precoUnitario: number;
};

type PedidoDetalhes = {
  id: string;
  recorrencia: string;
  estagio: string;
  diaAgendado: string;
  turno: string;
  estimativaEntrega: string;
  valorTotal: number;
  emailNotificacaoFalhou: boolean;
  itens: ItemPedido[];
  user: { name: string | null; email: string | null };
};

const ESTAGIO_LABELS: Record<string, string> = {
  PEDIDO_FEITO: "Pedido feito",
  ENTREGUE_NA_LOJA: "Entregue na loja",
  EM_LAVAGEM: "Em lavagem",
  PRONTO_RETIRADA: "Pronto para retirada",
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface ModalDetalhesPedidoProps {
  pedido: PedidoDetalhes | null;
  open: boolean;
  onClose: () => void;
  onEstagioUpdated: (id: string, novoEstagio: string, emailFalhou: boolean) => void;
}

export function ModalDetalhesPedido({ pedido, open, onClose, onEstagioUpdated }: ModalDetalhesPedidoProps) {
  const [mensagemDivergencia, setMensagemDivergencia] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isReenviando, setIsReenviando] = useState(false);

  if (!pedido) return null;

  async function handleEnviarDivergencia() {
    if (!mensagemDivergencia.trim() || !pedido) return;
    setIsSendingEmail(true);
    try {
      const res = await fetch(`/api/admin/pedidos/${pedido.id}/email-divergencia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: mensagemDivergencia }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao enviar e-mail.");
      } else {
        toast.success("E-mail enviado ao cliente.");
        setMensagemDivergencia("");
      }
    } catch {
      toast.error("Erro ao enviar e-mail.");
    } finally {
      setIsSendingEmail(false);
    }
  }

  async function handleReenviarNotificacao() {
    if (!pedido) return;
    setIsReenviando(true);
    try {
      const res = await fetch(`/api/admin/pedidos/${pedido.id}/estagio`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estagio: "PRONTO_RETIRADA" }),
      });
      if (!res.ok) {
        toast.error("Erro ao reenviar notificação.");
      } else {
        const updated = await res.json();
        onEstagioUpdated(pedido.id, "PRONTO_RETIRADA", updated.emailNotificacaoFalhou);
        toast.success("Notificação reenviada.");
      }
    } catch {
      toast.error("Erro ao reenviar notificação.");
    } finally {
      setIsReenviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Pedido #{pedido.id.slice(-6).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Client info */}
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <p className="font-medium text-gray-900">{pedido.user.name || "—"}</p>
            <p className="text-gray-500">{pedido.user.email || "—"}</p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Estágio atual</span>
            <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700">
              {ESTAGIO_LABELS[pedido.estagio] || pedido.estagio}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Recorrência</p>
              <p className="font-medium text-gray-900">
                {RECORRENCIA_LABELS[pedido.recorrencia as keyof typeof RECORRENCIA_LABELS] || pedido.recorrencia}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Turno</p>
              <p className="font-medium text-gray-900">
                {pedido.turno === "manha" ? "Manhã (08h–12h)" : "Tarde (14h–18h)"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Dia agendado</p>
              <p className="font-medium text-gray-900">{formatDate(pedido.diaAgendado)}</p>
            </div>
            <div>
              <p className="text-gray-500">Estimativa entrega</p>
              <p className="font-medium text-gray-900">{formatDate(pedido.estimativaEntrega)}</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Itens do pedido</p>
            <div className="divide-y rounded-lg border">
              {pedido.itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-700">
                    {item.itemNome} <span className="text-gray-400">×{item.quantidade}</span>
                  </span>
                  <span className="text-gray-900">
                    {formatBRL(item.precoUnitario * item.quantidade)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between bg-gray-50 px-4 py-2.5 font-semibold text-sm">
                <span>Total</span>
                <span className="text-indigo-600">{formatBRL(pedido.valorTotal)}</span>
              </div>
            </div>
          </div>

          {/* Email failed alert */}
          {pedido.emailNotificacaoFalhou && (
            <div className="flex items-start gap-3 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Falha no envio do e-mail de notificação</p>
                <p className="mt-0.5 text-orange-600">O cliente pode não ter recebido o aviso de pedido pronto.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-orange-300 text-orange-700 hover:bg-orange-100"
                onClick={handleReenviarNotificacao}
                disabled={isReenviando}
              >
                {isReenviando ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                <span className="ml-1">Reenviar</span>
              </Button>
            </div>
          )}

          {/* Divergence email */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700">
              Enviar e-mail ao cliente
            </Label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={3}
              placeholder="Descreva a divergência ou mensagem para o cliente..."
              value={mensagemDivergencia}
              onChange={(e) => setMensagemDivergencia(e.target.value)}
            />
            <Button
              size="sm"
              className="mt-2 bg-indigo-600 hover:bg-indigo-700"
              disabled={!mensagemDivergencia.trim() || isSendingEmail}
              onClick={handleEnviarDivergencia}
            >
              {isSendingEmail ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : null}
              Enviar e-mail
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
