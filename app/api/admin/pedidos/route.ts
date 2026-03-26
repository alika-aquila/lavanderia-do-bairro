import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calcularEstimativaEntrega } from "@/lib/catalogo";
import { z } from "zod";

const novosPedidoSchema = z.object({
  clienteNome: z.string().min(1),
  clienteEmail: z.string().email(),
  recorrencia: z.enum(["AVULSO", "SEMANAL", "QUINZENAL", "MENSAL"]),
  diaAgendado: z.string(), // ISO date string
  turno: z.enum(["manha", "tarde"]),
  itens: z.array(
    z.object({
      categoriaSlug: z.string(),
      itemSlug: z.string(),
      categoriaNome: z.string(),
      itemNome: z.string(),
      quantidade: z.number().int().min(1),
      precoUnitario: z.number().min(0),
    })
  ).min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "FUNCIONARIO") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const pedidos = await db.pedido.findMany({
    where: { pago: true, arquivado: false },
    include: { itens: true, user: { select: { name: true, email: true } } },
    orderBy: { diaAgendado: "asc" },
  });

  return NextResponse.json(
    pedidos.map((p) => ({
      ...p,
      valorTotal: Number(p.valorTotal),
      diaAgendado: p.diaAgendado.toISOString(),
      estimativaEntrega: p.estimativaEntrega.toISOString(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      itens: p.itens.map((i) => ({ ...i, precoUnitario: Number(i.precoUnitario) })),
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "FUNCIONARIO") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = novosPedidoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { clienteNome, clienteEmail, recorrencia, diaAgendado, turno, itens } = parsed.data;

  // Find or create client user
  let user = await db.user.findUnique({ where: { email: clienteEmail } });
  if (!user) {
    user = await db.user.create({
      data: {
        name: clienteNome,
        email: clienteEmail,
        role: "CLIENTE",
        plan: "FREE",
      },
    });
  }

  const diaAgendadoDate = new Date(diaAgendado);
  const estimativaEntrega = calcularEstimativaEntrega(diaAgendadoDate, recorrencia as "AVULSO" | "SEMANAL" | "QUINZENAL" | "MENSAL");
  const valorTotal = itens.reduce((sum, item) => sum + item.precoUnitario * item.quantidade, 0);

  const pedido = await db.pedido.create({
    data: {
      userId: user.id,
      recorrencia: recorrencia as "AVULSO" | "SEMANAL" | "QUINZENAL" | "MENSAL",
      estagio: "PEDIDO_FEITO",
      diaAgendado: diaAgendadoDate,
      turno,
      estimativaEntrega,
      valorTotal,
      pago: true,
      itens: {
        create: itens.map((item) => ({
          categoriaSlug: item.categoriaSlug,
          itemSlug: item.itemSlug,
          categoriaNome: item.categoriaNome,
          itemNome: item.itemNome,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
        })),
      },
    },
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
  }, { status: 201 });
}
