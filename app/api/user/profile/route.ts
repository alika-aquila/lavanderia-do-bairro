import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const body = await req.json();
  const { name, cpf, genero, dataNascimento, dddCelular, celular, dddTelefone, telefone, avatarDuck } = body;

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      name:           name           ?? undefined,
      cpf:            cpf            ?? undefined,
      genero:         genero         ?? undefined,
      dataNascimento: dataNascimento ?? undefined,
      dddCelular:     dddCelular     ?? undefined,
      celular:        celular        ?? undefined,
      dddTelefone:    dddTelefone    ?? undefined,
      telefone:       telefone       ?? undefined,
      avatarDuck:     avatarDuck     ?? undefined,
    },
  });
  return NextResponse.json(user);
}
