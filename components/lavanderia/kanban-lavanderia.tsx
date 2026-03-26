"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Archive, Package } from "lucide-react";
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
  arquivado: boolean;
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

function isOverdue(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

function sortByDate(pedidos: Pedido[], key: "diaAgendado" | "estimativaEntrega") {
  return [...pedidos].sort(
    (a, b) => new Date(a[key]).getTime() - new Date(b[key]).getTime()
  );
}

interface KanbanLavanderiaProps {
  initialPedidos: Pedido[];
}

export function KanbanLavanderia({ initialPedidos }: KanbanLavanderiaProps) {
  const queryClient = useQueryClient();
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dragOverColuna, setDragOverColuna] = useState<string | null>(null);
  const dragPedidoRef = useRef<{ id: string; estagio: string } | null>(null);
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.toLowerCase().trim() ?? "";

  const { data: allPedidos } = useQuery<Pedido[]>({
    queryKey: ["admin-pedidos"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pedidos");
      if (!res.ok) throw new Error("Falha ao buscar pedidos");
      return res.json();
    },
    initialData: initialPedidos,
    refetchInterval: 30_000,
  });

  // Filter out archived + apply search
  const pedidos = (allPedidos || []).filter((p) => {
    if (p.arquivado) return false;
    if (!q) return true;
    const tag = p.id.slice(-6).toUpperCase();
    const nome = (p.user.name || p.user.email || "").toLowerCase();
    return tag.includes(q.toUpperCase()) || nome.includes(q);
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
      } else if (updated.estagio === "PRONTO_RETIRADA") {
        toast.success("Pedido pronto! Cliente notificado por e-mail.");
      } else {
        toast.success("Pedido atualizado.");
      }
    },
  });

  const arquivarMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/pedidos/${id}/arquivar`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Falha ao arquivar pedido");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["admin-pedidos"] });
      const previous = queryClient.getQueryData<Pedido[]>(["admin-pedidos"]);
      queryClient.setQueryData<Pedido[]>(["admin-pedidos"], (old) =>
        old ? old.map((p) => (p.id === id ? { ...p, arquivado: true } : p)) : old
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["admin-pedidos"], ctx.previous);
      toast.error("Erro ao arquivar pedido.");
    },
    onSuccess: () => {
      toast.success("Pedido arquivado e movido para o histórico.");
      setModalOpen(false);
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

  function handleArquivar(e: React.MouseEvent, pedido: Pedido) {
    e.stopPropagation();
    arquivarMutation.mutate(pedido.id);
  }

  // Drag & Drop handlers
  function handleDragStart(e: React.DragEvent, pedido: Pedido) {
    dragPedidoRef.current = { id: pedido.id, estagio: pedido.estagio };
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, colunaKey: string) {
    e.preventDefault();
    const dragging = dragPedidoRef.current;
    if (!dragging) return;
    const nextEstagio = NEXT_ESTAGIO[dragging.estagio];
    if (nextEstagio === colunaKey) {
      e.dataTransfer.dropEffect = "move";
      setDragOverColuna(colunaKey);
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  }

  function handleDragLeave(colunaKey: string) {
    if (dragOverColuna === colunaKey) setDragOverColuna(null);
  }

  function handleDrop(e: React.DragEvent, colunaKey: string) {
    e.preventDefault();
    setDragOverColuna(null);
    const dragging = dragPedidoRef.current;
    if (!dragging) return;
    const nextEstagio = NEXT_ESTAGIO[dragging.estagio];
    if (nextEstagio === colunaKey) {
      moverMutation.mutate({ id: dragging.id, estagio: colunaKey });
    }
    dragPedidoRef.current = null;
  }

  function handleDragEnd() {
    dragPedidoRef.current = null;
    setDragOverColuna(null);
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUNAS.map((coluna) => {
          const isPedidoFeito = coluna.key === "PEDIDO_FEITO";
          const sortKey = isPedidoFeito ? "diaAgendado" : "estimativaEntrega";
          const pedidosColuna = sortByDate(
            pedidos.filter((p) => p.estagio === coluna.key),
            sortKey
          );
          const isDragTarget = dragOverColuna === coluna.key;

          return (
            <div
              key={coluna.key}
              className={`flex min-w-72 flex-col rounded-xl border transition-colors ${coluna.color} ${
                isDragTarget ? "ring-2 ring-indigo-400 ring-offset-1" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, coluna.key)}
              onDragLeave={() => handleDragLeave(coluna.key)}
              onDrop={(e) => handleDrop(e, coluna.key)}
            >
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

                {pedidosColuna.map((pedido) => {
                  const showAgendado = coluna.key === "PEDIDO_FEITO";
                  const dateStr = showAgendado ? pedido.diaAgendado : pedido.estimativaEntrega;
                  const dateLabel = showAgendado ? "Agendado" : "Estimativa";

                  // Overdue logic
                  const isAgendadoOverdue =
                    coluna.key === "PEDIDO_FEITO" && isOverdue(pedido.diaAgendado);
                  const isEstimativaOverdue =
                    (coluna.key === "ENTREGUE_NA_LOJA" || coluna.key === "EM_LAVAGEM") &&
                    isOverdue(pedido.estimativaEntrega);
                  const dateIsOverdue = isAgendadoOverdue || isEstimativaOverdue;

                  return (
                    <div
                      key={pedido.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, pedido)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleCardClick(pedido)}
                      className="w-full cursor-grab rounded-lg border bg-white p-4 text-left shadow-sm transition hover:shadow-md active:cursor-grabbing"
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
                          <p
                            className={`text-xs ${
                              dateIsOverdue
                                ? "font-bold text-red-600"
                                : "text-gray-400"
                            }`}
                          >
                            {dateLabel}: {formatDateShort(dateStr)}
                          </p>
                          <p className="text-sm font-bold text-indigo-600">
                            {formatBRL(pedido.valorTotal)}
                          </p>
                        </div>

                        {coluna.key === "PRONTO_RETIRADA" ? (
                          <button
                            onClick={(e) => handleArquivar(e, pedido)}
                            disabled={arquivarMutation.isPending}
                            className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
                            title="Arquivar pedido"
                          >
                            Arquivar
                            <Archive className="h-3 w-3" />
                          </button>
                        ) : NEXT_ESTAGIO[pedido.estagio] ? (
                          <button
                            onClick={(e) => handleMover(e, pedido)}
                            disabled={moverMutation.isPending}
                            className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50"
                            title="Mover para próxima etapa"
                          >
                            Avançar
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
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
        onArquivar={(id) => arquivarMutation.mutate(id)}
      />
    </>
  );
}
