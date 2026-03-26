import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { KanbanLavanderia } from "@/components/lavanderia/kanban-lavanderia";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "FUNCIONARIO") {
    redirect("/admin/login");
  }

  const pedidos = await db.pedido.findMany({
    where: { pago: true, arquivado: false },
    include: {
      itens: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { diaAgendado: "asc" },
  });

  const pedidosSerialized = pedidos.map((p) => ({
    ...p,
    valorTotal: Number(p.valorTotal),
    diaAgendado: p.diaAgendado.toISOString(),
    estimativaEntrega: p.estimativaEntrega.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    itens: p.itens.map((i) => ({
      ...i,
      precoUnitario: Number(i.precoUnitario),
    })),
  }));

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos Ativos</h1>
        <p className="text-gray-500">Gerencie o status de todos os pedidos em andamento.</p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        }
      >
        <KanbanLavanderia initialPedidos={pedidosSerialized} />
      </Suspense>
    </div>
  );
}
