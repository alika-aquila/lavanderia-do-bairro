import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { calcularEstimativaEntrega, calcularTotal, CATALOGO } from "@/lib/catalogo";

const criarPedidoSchema = z.object({
  categoriaSlug: z.string(),
  itens: z.array(z.object({
    itemSlug: z.string(),
    quantidade: z.number().int().min(1),
  })).min(1),
  recorrencia: z.enum(["AVULSO", "SEMANAL", "BISSEMANAL", "MENSAL"]),
  diaAgendado: z.string(),
  turno: z.enum(["manha", "tarde"]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const pedidos = await db.pedido.findMany({
    where: { userId: session.user.id },
    include: { itens: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pedidos);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = criarPedidoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });

  const { categoriaSlug, itens, recorrencia, diaAgendado, turno } = parsed.data;

  // Check for existing active order in same category
  const existingItems = await db.itemPedido.findFirst({
    where: {
      categoriaSlug,
      pedido: {
        userId: session.user.id,
        estagio: { not: "PRONTO_RETIRADA" },
        pago: true,
      },
    },
  });
  if (existingItems) {
    return NextResponse.json({ error: "Você já tem um pedido ativo nesta categoria." }, { status: 409 });
  }

  const categoria = CATALOGO.find((c) => c.slug === categoriaSlug);
  if (!categoria) return NextResponse.json({ error: "Categoria inválida" }, { status: 400 });

  const diaDate = new Date(diaAgendado);
  const estimativa = calcularEstimativaEntrega(diaDate, recorrencia);

  const itensComDetalhes = itens.map(({ itemSlug, quantidade }) => {
    const item = categoria.itens.find((i) => i.slug === itemSlug)!;
    return {
      categoriaSlug,
      categoriaNome: categoria.nome,
      itemSlug,
      itemNome: item.nome,
      quantidade,
      precoUnitario: item.precos[recorrencia],
    };
  });

  const valorTotal = calcularTotal(
    itens.map(({ itemSlug, quantidade }) => ({ itemSlug, categoriaSlug, quantidade })),
    recorrencia
  );

  const pedido = await db.pedido.create({
    data: {
      userId: session.user.id,
      recorrencia,
      diaAgendado: diaDate,
      turno,
      estimativaEntrega: estimativa,
      valorTotal,
      itens: { create: itensComDetalhes },
    },
    include: { itens: true },
  });

  return NextResponse.json(pedido, { status: 201 });
}
