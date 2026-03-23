import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { enviarEmailDivergencia } from "@/lib/email";

const schema = z.object({
  mensagem: z.string().min(1, "Descreva a divergência antes de enviar."),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "FUNCIONARIO") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { mensagem } = parsed.data;

  const pedido = await db.pedido.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!pedido || !pedido.user.email) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  await enviarEmailDivergencia({
    clienteEmail: pedido.user.email,
    clienteNome: pedido.user.name || "Cliente",
    pedidoId: id,
    mensagem,
  });

  return NextResponse.json({ ok: true });
}
