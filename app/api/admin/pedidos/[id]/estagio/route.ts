import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { enviarEmailPronto } from "@/lib/email";

const schema = z.object({
  estagio: z.enum(["PEDIDO_FEITO", "ENTREGUE_NA_LOJA", "EM_LAVAGEM", "PRONTO_RETIRADA"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "FUNCIONARIO") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { estagio } = parsed.data;

  const updated = await db.pedido.update({
    where: { id },
    data: { estagio, emailNotificacaoFalhou: false },
    include: { itens: true, user: { select: { name: true, email: true } } },
  });

  let emailFalhou = false;

  if (estagio === "PRONTO_RETIRADA" && updated.user.email) {
    try {
      await enviarEmailPronto({
        clienteEmail: updated.user.email,
        clienteNome: updated.user.name || "Cliente",
        pedidoId: id,
      });
    } catch {
      await db.pedido.update({ where: { id }, data: { emailNotificacaoFalhou: true } });
      emailFalhou = true;
    }
  }

  return NextResponse.json({ ...updated, emailNotificacaoFalhou: emailFalhou });
}
