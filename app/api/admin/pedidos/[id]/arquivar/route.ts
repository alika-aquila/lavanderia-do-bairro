import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "FUNCIONARIO") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const pedido = await db.pedido.update({
    where: { id },
    data: { arquivado: true },
    include: { itens: true, user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({
    ...pedido,
    valorTotal: Number(pedido.valorTotal),
    diaAgendado: pedido.diaAgendado.toISOString(),
    estimativaEntrega: pedido.estimativaEntrega.toISOString(),
    createdAt: pedido.createdAt.toISOString(),
    updatedAt: pedido.updatedAt.toISOString(),
    itens: pedido.itens.map((i) => ({ ...i, precoUnitario: Number(i.precoUnitario) })),
  });
}
