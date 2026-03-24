"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2 } from "lucide-react";

export function RecorrenciaActions({ pedidoId }: { pedidoId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Tem certeza que quer cancelar esta recorrência?")) return;
    setDeleting(true);
    await fetch(`/api/pedidos/${pedidoId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
        onClick={() => alert("Edição de recorrência em breve.")}
      >
        <Pencil className="h-3 w-3" />
        Editar
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
      >
        {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        Cancelar
      </button>
    </div>
  );
}
