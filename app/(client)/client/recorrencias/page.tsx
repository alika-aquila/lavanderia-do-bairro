import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { RECORRENCIA_LABELS } from "@/lib/catalogo";
import { RecorrenciaActions } from "@/components/lavanderia/recorrencia-actions";

function formatDate(date: Date | string) {
  const d = new Date(date);
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dateStr}`;
}

function nextDate(diaAgendado: Date, recorrencia: string): Date {
  const d = new Date(diaAgendado);
  const dias = recorrencia === "SEMANAL" ? 7 : recorrencia === "QUINZENAL" ? 15 : 30;
  d.setDate(d.getDate() + dias);
  return d;
}

function formatBRL(v: number | string) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function RecorrenciasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/client/recorrencias");

  const pedidos = await db.pedido.findMany({
    where: { userId: session.user.id, pago: true, recorrencia: { not: "AVULSO" } },
    include: { itens: true },
    orderBy: { createdAt: "desc" },
  });

  const ativos = pedidos.filter((p) => p.estagio !== "PRONTO_RETIRADA");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Recorrências</h1>
        <p className="text-gray-500">Seus serviços contratados com recorrência.</p>
      </div>

      {ativos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <RefreshCw className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma recorrência ativa</h3>
          <p className="mt-2 text-sm text-gray-500">
            Contrate um serviço com recorrência para ver aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ativos.map((pedido) => {
            const proxima = nextDate(pedido.diaAgendado, pedido.recorrencia);
            return (
              <div key={pedido.id} className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="h-4 w-4 text-indigo-500" />
                      <span className="font-semibold text-gray-900">
                        {pedido.itens[0]?.categoriaNome}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {RECORRENCIA_LABELS[pedido.recorrencia as keyof typeof RECORRENCIA_LABELS]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-0.5">
                      Último agendamento: {formatDate(pedido.diaAgendado)}
                    </p>
                    <p className="text-sm font-medium text-indigo-600">
                      Próxima previsão: {formatDate(proxima)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {pedido.itens.map((i) => `${i.itemNome} ×${i.quantidade}`).join(" · ")}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-3">
                    <p className="text-lg font-bold text-indigo-600">{formatBRL(pedido.valorTotal)}</p>
                    <RecorrenciaActions pedidoId={pedido.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
