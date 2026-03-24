"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { DuckIcon } from "@/components/ui/duck-icon";
import { Loader2, Check } from "lucide-react";

const DUCK_VARIANTS = [
  { id: "1", bg: "bg-indigo-100", icon: "text-indigo-600" },
  { id: "2", bg: "bg-amber-100",  icon: "text-amber-600"  },
  { id: "3", bg: "bg-emerald-100",icon: "text-emerald-600"},
  { id: "4", bg: "bg-rose-100",   icon: "text-rose-600"   },
  { id: "5", bg: "bg-sky-100",    icon: "text-sky-600"    },
];

export default function MeusDadosPage() {
  const { update } = useSession();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name:          "",
    cpf:           "",
    email:         "",
    genero:        "",
    dataNascimento:"",
    dddCelular:    "",
    celular:       "",
    dddTelefone:   "",
    telefone:      "",
    avatarDuck:    "1",
  });

  // Carrega dados completos do banco (a sessão JWT não persiste campos extras como cpf, genero, etc.)
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name:           data.name           ?? "",
          email:          data.email          ?? "",
          cpf:            data.cpf            ?? "",
          genero:         data.genero         ?? "",
          dataNascimento: data.dataNascimento  ?? "",
          dddCelular:     data.dddCelular     ?? "",
          celular:        data.celular        ?? "",
          dddTelefone:    data.dddTelefone    ?? "",
          telefone:       data.telefone       ?? "",
          avatarDuck:     data.avatarDuck     ?? "1",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    await update();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-10">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando seus dados…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meus Dados</h1>
        <p className="text-gray-500">Confira ou altere seus dados de cadastro.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Duck avatar selection */}
        <div>
          <p className={labelClass}>Escolha seu Patô</p>
          <div className="flex gap-3 mt-4">
            {DUCK_VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setForm((p) => ({ ...p, avatarDuck: v.id }))}
                className={[
                  "relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full transition",
                  v.bg,
                  form.avatarDuck === v.id ? "ring-2 ring-offset-2 ring-indigo-500" : "opacity-70 hover:opacity-100",
                ].join(" ")}
              >
                <DuckIcon className={`h-7 w-7 ${v.icon}`} />
                {form.avatarDuck === v.id && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Row: Nome + CPF */}
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className={labelClass}>Nome completo</label>
            <input className={inputClass} name="name" value={form.name} onChange={handleChange} placeholder="Seu nome" />
          </div>
          <div className="w-48">
            <label className={labelClass}>CPF</label>
            <input className={`${inputClass} bg-gray-50`} name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" />
          </div>
        </div>

        {/* Row: Email + Gênero */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>E-mail</label>
            <input className={`${inputClass} bg-gray-50`} type="email" name="email" value={form.email} readOnly disabled placeholder="seu@email.com" />
          </div>
          <div>
            <label className={labelClass}>Gênero</label>
            <select className={inputClass} name="genero" value={form.genero} onChange={handleChange}>
              <option value="">Selecione</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Não binário">Não binário</option>
              <option value="Prefiro não informar">Prefiro não informar</option>
            </select>
          </div>
        </div>

        {/* Row: Data de nascimento + DDD Cel + Celular + DDD Tel + Telefone */}
        <div className="grid gap-4 sm:grid-cols-[1fr_80px_1fr_80px_1fr]">
          <div>
            <label className={labelClass}>Data de nascimento</label>
            <input className={inputClass} name="dataNascimento" value={form.dataNascimento} onChange={handleChange} placeholder="DD/MM/AAAA" />
          </div>
          <div>
            <label className={labelClass}>DDD</label>
            <input className={inputClass} name="dddCelular" value={form.dddCelular} onChange={handleChange} placeholder="11" maxLength={3} />
          </div>
          <div>
            <label className={labelClass}>Celular</label>
            <input className={inputClass} name="celular" value={form.celular} onChange={handleChange} placeholder="99999-9999" />
          </div>
          <div>
            <label className={labelClass}>DDD</label>
            <input className={inputClass} name="dddTelefone" value={form.dddTelefone} onChange={handleChange} placeholder="11" maxLength={3} />
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input className={inputClass} name="telefone" value={form.telefone} onChange={handleChange} placeholder="9999-9999" />
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 px-8"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : null}
          {saved ? "Salvo!" : "Salvar"}
        </Button>
      </form>
    </div>
  );
}
