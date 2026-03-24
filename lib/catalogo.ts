export type Recorrencia = "AVULSO" | "SEMANAL" | "QUINZENAL" | "MENSAL";

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
      { slug: "toalha-banho", nome: "Toalha de Banho", precos: { AVULSO: 10, SEMANAL: 8.5, QUINZENAL: 9, MENSAL: 9.5 } },
      { slug: "toalha-rosto", nome: "Toalha de Rosto", precos: { AVULSO: 6, SEMANAL: 5, QUINZENAL: 5.5, MENSAL: 5.8 } },
      { slug: "toalha-grande", nome: "Toalha Grande", precos: { AVULSO: 12, SEMANAL: 10, QUINZENAL: 10.5, MENSAL: 11 } },
    ],
  },
  {
    slug: "roupa-de-cama",
    nome: "Roupa de Cama",
    itens: [
      { slug: "lencol", nome: "Lençol", precos: { AVULSO: 18, SEMANAL: 15, QUINZENAL: 16, MENSAL: 17 } },
      { slug: "fronha", nome: "Fronha", precos: { AVULSO: 6, SEMANAL: 5, QUINZENAL: 5.5, MENSAL: 5.8 } },
      { slug: "edredom", nome: "Edredom", precos: { AVULSO: 35, SEMANAL: 30, QUINZENAL: 32, MENSAL: 33 } },
      { slug: "cobertor", nome: "Cobertor", precos: { AVULSO: 30, SEMANAL: 26, QUINZENAL: 28, MENSAL: 29 } },
    ],
  },
  {
    slug: "roupas",
    nome: "Roupas",
    itens: [
      { slug: "camiseta", nome: "Camiseta", precos: { AVULSO: 8, SEMANAL: 6.5, QUINZENAL: 7, MENSAL: 7.5 } },
      { slug: "camisa-social", nome: "Camisa Social", precos: { AVULSO: 10, SEMANAL: 8.5, QUINZENAL: 9, MENSAL: 9.5 } },
      { slug: "calca", nome: "Calça", precos: { AVULSO: 12, SEMANAL: 10, QUINZENAL: 10.5, MENSAL: 11 } },
      { slug: "jeans", nome: "Jeans", precos: { AVULSO: 14, SEMANAL: 12, QUINZENAL: 12.5, MENSAL: 13 } },
      { slug: "vestido", nome: "Vestido", precos: { AVULSO: 15, SEMANAL: 12.5, QUINZENAL: 13, MENSAL: 14 } },
      { slug: "casaco", nome: "Casaco", precos: { AVULSO: 18, SEMANAL: 15.5, QUINZENAL: 16.5, MENSAL: 17 } },
      { slug: "terno", nome: "Terno (Conjunto)", precos: { AVULSO: 28, SEMANAL: 24, QUINZENAL: 25, MENSAL: 26 } },
      { slug: "pecas-delicadas", nome: "Peças Delicadas", precos: { AVULSO: 16, SEMANAL: 13.5, QUINZENAL: 14.5, MENSAL: 15 } },
    ],
  },
];

export const DIAS_ENTREGA: Record<Recorrencia, number> = {
  AVULSO: 3,
  SEMANAL: 5,
  QUINZENAL: 5,
  MENSAL: 7,
};

export const RECORRENCIA_LABELS: Record<Recorrencia, string> = {
  AVULSO: "Avulso",
  SEMANAL: "Semanal",
  QUINZENAL: "Quinzenal",
  MENSAL: "Mensal",
};

/** Brazilian national fixed holidays (month 1-based, day) */
const FERIADOS_FIXOS: [number, number][] = [
  [1, 1],   // Ano Novo
  [4, 21],  // Tiradentes
  [5, 1],   // Dia do Trabalho
  [9, 7],   // Independência do Brasil
  [10, 12], // Nossa Senhora Aparecida
  [11, 2],  // Finados
  [11, 15], // Proclamação da República
  [11, 20], // Dia da Consciência Negra
  [12, 25], // Natal
];

function isFeriado(date: Date): boolean {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return FERIADOS_FIXOS.some(([hm, hd]) => hm === m && hd === d);
}

function isDiaUtil(date: Date): boolean {
  const dow = date.getDay();
  return dow !== 0 && dow !== 6 && !isFeriado(date);
}

export function calcularEstimativaEntrega(diaAgendado: Date, recorrencia: Recorrencia): Date {
  const diasParaAdicionar = DIAS_ENTREGA[recorrencia];
  const entrega = new Date(diaAgendado);
  let adicionados = 0;
  while (adicionados < diasParaAdicionar) {
    entrega.setDate(entrega.getDate() + 1);
    if (isDiaUtil(entrega)) adicionados++;
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
