import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { RECORRENCIA_LABELS } from "@/lib/catalogo";

const ESTAGIO_LABELS: Record<string, string> = {
  PEDIDO_FEITO: "Pedido feito",
  ENTREGUE_NA_LOJA: "Entregue na loja",
  EM_LAVAGEM: "Em lavagem",
  PRONTO_RETIRADA: "Pronto para retirada",
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function HistoricoPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "FUNCIONARIO") {
    redirect("/admin/login");
  }

  const pedidos = await db.pedido.findMany({
    where: { pago: true },
    include: {
      itens: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { diaAgendado: "desc" },
  });

  const ativos = pedidos.filter((p) => !p.arquivado);
  const arquivados = pedidos.filter((p) => p.arquivado);

  function PedidoRow({
    p,
    dimmed,
  }: {
    p: (typeof pedidos)[number];
    dimmed?: boolean;
  }) {
    return (
      <div
        className={`grid grid-cols-[minmax(160px,1fr)_minmax(140px,180px)_minmax(200px,auto)_auto_auto] items-center gap-4 rounded-lg border bg-white px-5 py-4 text-sm transition ${
          dimmed ? "opacity-60" : ""
        }`}
      >
        {/* Cliente */}
        <div>
          <p className="font-medium text-gray-900">
            {p.user.name || p.user.email || "Cliente"}
          </p>
          <p className="text-xs text-gray-400">#{p.id.slice(-6).toUpperCase()}</p>
        </div>

        {/* Itens */}
        <div>
          <p className="text-gray-700">
            {p.itens[0]?.categoriaNome ?? "—"}
            {p.itens.length > 1 && (
              <span className="ml-1 text-gray-400">+{p.itens.length - 1}</span>
            )}
          </p>
          <p className="text-xs text-gray-400">
            {RECORRENCIA_LABELS[p.recorrencia as keyof typeof RECORRENCIA_LABELS] ?? p.recorrencia}
          </p>
        </div>

        {/* Datas */}
        <div className="text-right">
          <p className="text-gray-700">Agendado: {formatDate(p.diaAgendado)}</p>
          <p className="text-xs text-gray-400">
            Estimativa: {formatDate(p.estimativaEntrega)}
          </p>
        </div>

        {/* Estágio */}
        <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-700 whitespace-nowrap">
          {ESTAGIO_LABELS[p.estagio] ?? p.estagio}
        </span>

        {/* Valor */}
        <p className="text-right font-semibold text-indigo-600">
          {formatBRL(Number(p.valorTotal))}
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Pedidos</h1>
        <p className="text-gray-500">Todos os pedidos — ativos e arquivados.</p>
      </div>

      {/* Ativos */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-700">Pedidos Ativos</h2>
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
            {ativos.length}
          </span>
        </div>
        {ativos.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum pedido ativo no momento.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {ativos.map((p) => (
              <PedidoRow key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* Arquivados */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-700">Arquivados</h2>
          <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-500">
            {arquivados.length}
          </span>
        </div>
        {arquivados.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum pedido arquivado ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {arquivados.map((p) => (
              <PedidoRow key={p.id} p={p} dimmed />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
