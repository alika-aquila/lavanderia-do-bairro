import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "FUNCIONARIO") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const pedidos = await db.pedido.findMany({
    where: { pago: true },
    include: { itens: true, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pedidos);
}
