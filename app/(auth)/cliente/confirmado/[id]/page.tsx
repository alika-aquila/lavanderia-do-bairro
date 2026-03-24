import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { RECORRENCIA_LABELS } from "@/lib/catalogo";

function formatBRL(value: number | string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "Quarta-feira, 25/03/2026" */
function formatDate(date: Date | string) {
  const d = new Date(date);
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateStr = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dateStr}`;
}

export default async function ConfirmadoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const pedido = await db.pedido.findUnique({
    where: { id },
    include: { itens: true },
  });

  if (!pedido || pedido.userId !== session.user.id) {
    redirect("/cliente");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900">Pedido confirmado!</h1>
      <p className="mt-3 text-gray-500">
        Pedido <strong>#{id.slice(-6).toUpperCase()}</strong> recebido com sucesso.
      </p>

      <div className="mx-auto mt-8 max-w-md rounded-xl border bg-white p-6 text-left shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">Detalhes do pedido</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Categoria</span>
            <span className="font-medium text-gray-900">{pedido.itens[0]?.categoriaNome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Recorrência</span>
            <span className="font-medium text-gray-900">
              {RECORRENCIA_LABELS[pedido.recorrencia as keyof typeof RECORRENCIA_LABELS]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Turno</span>
            <span className="font-medium text-gray-900">
              {pedido.turno === "manha" ? "Manhã (08h–12h)" : "Tarde (14h–18h)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Dia agendado</span>
            <span className="font-medium text-gray-900 capitalize">{formatDate(pedido.diaAgendado)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Estimativa de entrega</span>
            <span className="font-medium text-gray-900 capitalize">{formatDate(pedido.estimativaEntrega)}</span>
          </div>
        </div>

        <div className="mt-4 divide-y rounded-lg border">
          {pedido.itens.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-gray-700">
                {item.itemNome} <span className="text-gray-400">×{item.quantidade}</span>
              </span>
              <span className="text-gray-900">
                {formatBRL(Number(item.precoUnitario) * item.quantidade)}
              </span>
            </div>
          ))}
          <div className="flex justify-between bg-gray-50 px-4 py-3 font-semibold text-sm">
            <span>Total pago</span>
            <span className="text-indigo-600">{formatBRL(pedido.valorTotal)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-indigo-50 px-6 py-4 text-sm text-indigo-700">
        <p className="font-medium">A lavanderia estará aguardando suas roupas no dia selecionado.</p>
        <p className="mt-1 text-indigo-500">
          Você receberá um e-mail quando o pedido estiver pronto para retirada.
        </p>
      </div>

      <div className="mt-8">
        <Link href="/client">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            Acompanhar pedido
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
