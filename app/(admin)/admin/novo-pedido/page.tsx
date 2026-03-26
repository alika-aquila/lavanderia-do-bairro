"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATALOGO, type Recorrencia } from "@/lib/catalogo";
import Link from "next/link";

type ItemSelecionado = {
  categoriaSlug: string;
  itemSlug: string;
  categoriaNome: string;
  itemNome: string;
  quantidade: number;
  precoUnitario: number;
};

export default function NovoPedidoAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [clienteNome, setClienteNome] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [recorrencia, setRecorrencia] = useState<Recorrencia>("AVULSO");
  const [diaAgendado, setDiaAgendado] = useState("");
  const [turno, setTurno] = useState<"manha" | "tarde">("manha");
  const [itens, setItens] = useState<ItemSelecionado[]>([]);

  // New item form state
  const [novaCategoria, setNovaCategoria] = useState(CATALOGO[0].slug);
  const [novoItem, setNovoItem] = useState(CATALOGO[0].itens[0].slug);
  const [novaQtd, setNovaQtd] = useState(1);

  const categoriaAtual = CATALOGO.find((c) => c.slug === novaCategoria)!;
  const itemAtual = categoriaAtual.itens.find((i) => i.slug === novoItem) ?? categoriaAtual.itens[0];

  function handleAddItem() {
    const preco = itemAtual.precos[recorrencia];
    const existing = itens.findIndex(
      (i) => i.categoriaSlug === novaCategoria && i.itemSlug === novoItem
    );
    if (existing >= 0) {
      setItens((prev) =>
        prev.map((i, idx) =>
          idx === existing ? { ...i, quantidade: i.quantidade + novaQtd } : i
        )
      );
    } else {
      setItens((prev) => [
        ...prev,
        {
          categoriaSlug: novaCategoria,
          itemSlug: novoItem,
          categoriaNome: categoriaAtual.nome,
          itemNome: itemAtual.nome,
          quantidade: novaQtd,
          precoUnitario: preco,
        },
      ]);
    }
    setNovaQtd(1);
  }

  function handleRemoveItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = itens.reduce((sum, i) => sum + i.precoUnitario * i.quantidade, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteNome,
          clienteEmail,
          recorrencia,
          diaAgendado,
          turno,
          itens,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao criar pedido.");
      } else {
        toast.success("Pedido criado com sucesso!");
        router.push("/admin/dashboard");
      }
    } catch {
      toast.error("Erro ao criar pedido.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Criar Novo Pedido</h1>
        <p className="text-gray-500">Cadastre um pedido para um cliente presencial.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                placeholder="Nome do cliente"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@email.com"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="data">Data de agendamento</Label>
                <Input
                  id="data"
                  type="date"
                  value={diaAgendado}
                  onChange={(e) => setDiaAgendado(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="turno">Turno</Label>
                <select
                  id="turno"
                  value={turno}
                  onChange={(e) => setTurno(e.target.value as "manha" | "tarde")}
                  className="h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm text-gray-900"
                >
                  <option value="manha">Manhã (08h–12h)</option>
                  <option value="tarde">Tarde (14h–18h)</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="recorrencia">Recorrência</Label>
              <select
                id="recorrencia"
                value={recorrencia}
                onChange={(e) => {
                  setRecorrencia(e.target.value as Recorrencia);
                  setItens([]); // reset items when recorrencia changes (prices change)
                }}
                className="h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm text-gray-900"
              >
                <option value="AVULSO">Avulso</option>
                <option value="SEMANAL">Semanal</option>
                <option value="QUINZENAL">Quinzenal</option>
                <option value="MENSAL">Mensal</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Itens do pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add item row */}
            <div className="flex gap-2 items-end flex-wrap">
              <div className="space-y-1 flex-1 min-w-[140px]">
                <Label>Categoria</Label>
                <select
                  value={novaCategoria}
                  onChange={(e) => {
                    setNovaCategoria(e.target.value);
                    const cat = CATALOGO.find((c) => c.slug === e.target.value)!;
                    setNovoItem(cat.itens[0].slug);
                  }}
                  className="h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm text-gray-900"
                >
                  {CATALOGO.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 flex-1 min-w-[160px]">
                <Label>Item</Label>
                <select
                  value={novoItem}
                  onChange={(e) => setNovoItem(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm text-gray-900"
                >
                  {categoriaAtual.itens.map((i) => (
                    <option key={i.slug} value={i.slug}>
                      {i.nome} — R$ {i.precos[recorrencia].toFixed(2).replace(".", ",")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 w-20">
                <Label>Qtd</Label>
                <Input
                  type="number"
                  min={1}
                  value={novaQtd}
                  onChange={(e) => setNovaQtd(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddItem}
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {/* Items list */}
            {itens.length > 0 && (
              <div className="divide-y rounded-lg border">
                {itens.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-700">
                      {item.itemNome}{" "}
                      <span className="text-gray-400">×{item.quantidade}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-900">
                        R$ {(item.precoUnitario * item.quantidade).toFixed(2).replace(".", ",")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between bg-gray-50 px-4 py-2.5 font-semibold text-sm">
                  <span>Total</span>
                  <span className="text-indigo-600">
                    R$ {total.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Criar Pedido
        </Button>
      </form>
    </div>
  );
}
