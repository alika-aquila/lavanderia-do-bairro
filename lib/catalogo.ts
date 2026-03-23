export type Recorrencia = "AVULSO" | "SEMANAL" | "BISSEMANAL" | "MENSAL";

export interface ItemCatalogo {
  slug: string;
  nome: string;
  precos: Record<Recorrencia, number>;
}

export interface Categoria {
  slug: string;
  nome: string;
  itens: ItemCatalogo[];
}

export const CATALOGO: Categoria[] = [
  {
    slug: "toalhas",
    nome: "Toalhas",
    itens: [
      { slug: "toalha-banho", nome: "Toalha de banho", precos: { AVULSO: 8, SEMANAL: 6, BISSEMANAL: 5.5, MENSAL: 5 } },
      { slug: "toalha-rosto", nome: "Toalha de rosto", precos: { AVULSO: 5, SEMANAL: 4, BISSEMANAL: 3.5, MENSAL: 3 } },
      { slug: "toalha-piso", nome: "Toalha de piso", precos: { AVULSO: 6, SEMANAL: 4.5, BISSEMANAL: 4, MENSAL: 3.5 } },
    ],
  },
  {
    slug: "roupa-de-cama",
    nome: "Roupa de Cama",
    itens: [
      { slug: "lencol-casal", nome: "Lençol casal", precos: { AVULSO: 18, SEMANAL: 14, BISSEMANAL: 12, MENSAL: 10 } },
      { slug: "lencol-solteiro", nome: "Lençol solteiro", precos: { AVULSO: 12, SEMANAL: 9, BISSEMANAL: 8, MENSAL: 7 } },
      { slug: "fronha", nome: "Fronha", precos: { AVULSO: 5, SEMANAL: 4, BISSEMANAL: 3.5, MENSAL: 3 } },
      { slug: "edredom-casal", nome: "Edredom casal", precos: { AVULSO: 30, SEMANAL: 24, BISSEMANAL: 22, MENSAL: 20 } },
      { slug: "edredom-solteiro", nome: "Edredom solteiro", precos: { AVULSO: 22, SEMANAL: 18, BISSEMANAL: 16, MENSAL: 14 } },
    ],
  },
  {
    slug: "roupas",
    nome: "Roupas",
    itens: [
      { slug: "camiseta", nome: "Camiseta", precos: { AVULSO: 7, SEMANAL: 5.5, BISSEMANAL: 5, MENSAL: 4.5 } },
      { slug: "calca-jeans", nome: "Calça jeans", precos: { AVULSO: 12, SEMANAL: 9, BISSEMANAL: 8, MENSAL: 7 } },
      { slug: "vestido", nome: "Vestido", precos: { AVULSO: 14, SEMANAL: 11, BISSEMANAL: 10, MENSAL: 9 } },
      { slug: "shorts", nome: "Shorts", precos: { AVULSO: 7, SEMANAL: 5.5, BISSEMANAL: 5, MENSAL: 4.5 } },
      { slug: "camisa-social", nome: "Camisa social", precos: { AVULSO: 12, SEMANAL: 9, BISSEMANAL: 8, MENSAL: 7 } },
    ],
  },
];

export const DIAS_ENTREGA: Record<Recorrencia, number> = {
  AVULSO: 3,
  SEMANAL: 5,
  BISSEMANAL: 5,
  MENSAL: 7,
};

export const RECORRENCIA_LABELS: Record<Recorrencia, string> = {
  AVULSO: "Avulso",
  SEMANAL: "Semanal",
  BISSEMANAL: "Bissemanal",
  MENSAL: "Mensal",
};

export function calcularEstimativaEntrega(diaAgendado: Date, recorrencia: Recorrencia): Date {
  const diasParaAdicionar = DIAS_ENTREGA[recorrencia];
  const entrega = new Date(diaAgendado);
  let adicionados = 0;
  while (adicionados < diasParaAdicionar) {
    entrega.setDate(entrega.getDate() + 1);
    const diaSemana = entrega.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) adicionados++; // skip weekends
  }
  return entrega;
}

export function calcularTotal(
  itens: { itemSlug: string; categoriaSlug: string; quantidade: number }[],
  recorrencia: Recorrencia
): number {
  let total = 0;
  for (const { itemSlug, categoriaSlug, quantidade } of itens) {
    const cat = CATALOGO.find((c) => c.slug === categoriaSlug);
    const item = cat?.itens.find((i) => i.slug === itemSlug);
    if (item && quantidade > 0) {
      total += item.precos[recorrencia] * quantidade;
    }
  }
  return total;
}
