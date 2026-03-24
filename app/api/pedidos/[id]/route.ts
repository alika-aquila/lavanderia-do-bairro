import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const pedido = await db.pedido.findUnique({ where: { id } });
  if (!pedido || pedido.userId !== session.user.id) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }
  await db.pedido.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
