import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WashingMachine, Package, ArrowRight, CheckCircle2 } from "lucide-react";

const ESTAGIO_LABELS: Record<string, string> = {
  PEDIDO_FEITO: "Pedido feito",
  ENTREGUE_NA_LOJA: "Entregue na loja",
  EM_LAVAGEM: "Em lavagem",
  PRONTO_RETIRADA: "Pronto para retirada",
};

const ESTAGIO_ORDER = ["PEDIDO_FEITO", "ENTREGUE_NA_LOJA", "EM_LAVAGEM", "PRONTO_RETIRADA"];

function formatBRL(value: number | string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function ClientePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const pedidos = await db.pedido.findMany({
    where: { userId: session.user.id, pago: true },
    include: { itens: true },
    orderBy: { createdAt: "desc" },
  });

  const pedidosAtivos = pedidos.filter((p) => p.estagio !== "PRONTO_RETIRADA");
  const pedidosConcluidos = pedidos.filter((p) => p.estagio === "PRONTO_RETIRADA");

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
          <p className="text-gray-500">Acompanhe o status dos seus pedidos</p>
        </div>
        <Link href="/cotacao">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <WashingMachine className="mr-2 h-4 w-4" />
            Novo pedido
          </Button>
        </Link>
      </div>

      {pedidosAtivos.length === 0 && pedidosConcluidos.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum pedido ainda</h3>
          <p className="mt-2 text-sm text-gray-500">
            Faça sua primeira cotação e contrate nosso serviço de lavanderia.
          </p>
          <Link href="/cotacao" className="mt-6 inline-block">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Fazer cotação grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {pedidosAtivos.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Pedidos ativos</h2>
          <div className="space-y-4">
            {pedidosAtivos.map((pedido) => {
              const estagioIndex = ESTAGIO_ORDER.indexOf(pedido.estagio);
              return (
                <div key={pedido.id} className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Pedido #{pedido.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="font-medium text-gray-900">
                        {pedido.itens[0]?.categoriaNome}{" "}
                        {pedido.itens.length > 1 && `+${pedido.itens.length - 1} categorias`}
                      </p>
                      <p className="text-sm text-gray-500">
                        Agendado: {formatDate(pedido.diaAgendado)} — Turno: {pedido.turno === "manha" ? "Manhã" : "Tarde"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">
                        {formatBRL(pedido.valorTotal)}
                      </p>
                      <p className="text-xs text-gray-400">Entrega até {formatDate(pedido.estimativaEntrega)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      {ESTAGIO_ORDER.map((estagio, idx) => (
                        <div key={estagio} className="flex flex-1 flex-col items-center">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              idx <= estagioIndex
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {idx < estagioIndex ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <p className={`mt-1 text-center text-xs ${idx <= estagioIndex ? "text-indigo-600 font-medium" : "text-gray-400"}`}>
                            {ESTAGIO_LABELS[estagio]}
                          </p>
                        </div>
                      ))}
                    </div>
                    {/* Connecting lines */}
                    <div className="absolute left-0 right-0 top-3 -z-10 flex items-center px-3">
                      {ESTAGIO_ORDER.slice(0, -1).map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-0.5 flex-1 ${idx < estagioIndex ? "bg-indigo-600" : "bg-gray-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {pedidosConcluidos.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-500">Pedidos concluídos</h2>
          <div className="space-y-3">
            {pedidosConcluidos.map((pedido) => (
              <div key={pedido.id} className="rounded-xl border bg-gray-50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      #{pedido.id.slice(-6).toUpperCase()} — {formatDate(pedido.diaAgendado)}
                    </p>
                    <p className="font-medium text-gray-700">
                      {pedido.itens[0]?.categoriaNome}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Pronto</span>
                    <span className="ml-2 font-bold text-gray-700">{formatBRL(pedido.valorTotal)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
