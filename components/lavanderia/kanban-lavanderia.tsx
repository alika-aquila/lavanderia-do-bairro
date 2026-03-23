"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Package } from "lucide-react";
import { ModalDetalhesPedido } from "./modal-detalhes-pedido";

type ItemPedido = {
  id: string;
  itemNome: string;
  categoriaNome: string;
  quantidade: number;
  precoUnitario: number;
  pedidoId: string;
  categoriaSlug: string;
  itemSlug: string;
};

type Pedido = {
  id: string;
  recorrencia: string;
  estagio: string;
  diaAgendado: string;
  turno: string;
  estimativaEntrega: string;
  valorTotal: number;
  emailNotificacaoFalhou: boolean;
  pago: boolean;
  createdAt: string;
  updatedAt: string;
  itens: ItemPedido[];
  user: { name: string | null; email: string | null };
};

const COLUNAS = [
  { key: "PEDIDO_FEITO", label: "Pedido feito", color: "bg-blue-50 border-blue-200" },
  { key: "ENTREGUE_NA_LOJA", label: "Entregue na loja", color: "bg-yellow-50 border-yellow-200" },
  { key: "EM_LAVAGEM", label: "Em lavagem", color: "bg-orange-50 border-orange-200" },
  { key: "PRONTO_RETIRADA", label: "Pronto para retirada", color: "bg-green-50 border-green-200" },
];

const NEXT_ESTAGIO: Record<string, string> = {
  PEDIDO_FEITO: "ENTREGUE_NA_LOJA",
  ENTREGUE_NA_LOJA: "EM_LAVAGEM",
  EM_LAVAGEM: "PRONTO_RETIRADA",
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

interface KanbanLavanderiaProps {
  initialPedidos: Pedido[];
}

export function KanbanLavanderia({ initialPedidos }: KanbanLavanderiaProps) {
  const queryClient = useQueryClient();
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: pedidos } = useQuery<Pedido[]>({
    queryKey: ["admin-pedidos"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pedidos");
      if (!res.ok) throw new Error("Falha ao buscar pedidos");
      return res.json();
    },
    initialData: initialPedidos,
    refetchInterval: 30_000,
  });

  const moverMutation = useMutation({
    mutationFn: async ({ id, estagio }: { id: string; estagio: string }) => {
      const res = await fetch(`/api/admin/pedidos/${id}/estagio`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estagio }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar estágio");
      return res.json();
    },
    onMutate: async ({ id, estagio }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-pedidos"] });
      const previous = queryClient.getQueryData<Pedido[]>(["admin-pedidos"]);
      queryClient.setQueryData<Pedido[]>(["admin-pedidos"], (old) =>
        old ? old.map((p) => (p.id === id ? { ...p, estagio } : p)) : old
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["admin-pedidos"], ctx.previous);
      toast.error("Erro ao mover pedido.");
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Pedido[]>(["admin-pedidos"], (old) =>
        old ? old.map((p) => (p.id === updated.id ? updated : p)) : old
      );
      if (updated.emailNotificacaoFalhou) {
        toast.warning("Pedido atualizado, mas o e-mail ao cliente falhou.");
      } else {
        toast.success("Pedido atualizado.");
      }
    },
  });

  function handleEstagioUpdated(id: string, novoEstagio: string, emailFalhou: boolean) {
    queryClient.setQueryData<Pedido[]>(["admin-pedidos"], (old) =>
      old
        ? old.map((p) =>
            p.id === id ? { ...p, estagio: novoEstagio, emailNotificacaoFalhou: emailFalhou } : p
          )
        : old
    );
    if (selectedPedido?.id === id) {
      setSelectedPedido((prev) =>
        prev ? { ...prev, estagio: novoEstagio, emailNotificacaoFalhou: emailFalhou } : prev
      );
    }
  }

  function handleCardClick(pedido: Pedido) {
    setSelectedPedido(pedido);
    setModalOpen(true);
  }

  function handleMover(e: React.MouseEvent, pedido: Pedido) {
    e.stopPropagation();
    const next = NEXT_ESTAGIO[pedido.estagio];
    if (!next) return;
    moverMutation.mutate({ id: pedido.id, estagio: next });
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUNAS.map((coluna) => {
          const pedidosColuna = (pedidos || []).filter((p) => p.estagio === coluna.key);

          return (
            <div key={coluna.key} className={`flex min-w-72 flex-col rounded-xl border ${coluna.color}`}>
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="font-semibold text-gray-700">{coluna.label}</h3>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-500 shadow-sm">
                  {pedidosColuna.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-3">
                {pedidosColuna.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-10 text-center">
                    <Package className="h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-xs text-gray-400">Nenhum pedido</p>
                  </div>
                )}

                {pedidosColuna.map((pedido) => (
                  <button
                    key={pedido.id}
                    onClick={() => handleCardClick(pedido)}
                    className="w-full rounded-lg border bg-white p-4 text-left shadow-sm transition hover:shadow-md"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-gray-400">
                          #{pedido.id.slice(-6).toUpperCase()}
                        </p>
                        <p className="mt-0.5 font-semibold text-gray-900">
                          {pedido.user.name || pedido.user.email || "Cliente"}
                        </p>
                      </div>
                      {pedido.emailNotificacaoFalhou && (
                        <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-600">
                          Email falhou
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600">
                      {pedido.itens[0]?.categoriaNome}
                      {pedido.itens.length > 1 && ` +${pedido.itens.length - 1}`}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">
                          Agendado: {formatDateShort(pedido.diaAgendado)}
                        </p>
                        <p className="text-sm font-bold text-indigo-600">{formatBRL(pedido.valorTotal)}</p>
                      </div>

                      {NEXT_ESTAGIO[pedido.estagio] && (
                        <button
                          onClick={(e) => handleMover(e, pedido)}
                          disabled={moverMutation.isPending}
                          className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50"
                          title="Mover para próxima etapa"
                        >
                          Avançar
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <ModalDetalhesPedido
        pedido={selectedPedido}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onEstagioUpdated={handleEstagioUpdated}
      />
    </>
  );
}
