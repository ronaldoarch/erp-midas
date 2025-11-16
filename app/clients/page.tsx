"use client";
import { useState } from "react";
import Link from "next/link";
import { createClientWithContract } from "@/server/actions/clients";

export default function ClientsPage() {
    const [name, setName] = useState("");
    const [niche, setNiche] = useState<string>("cassino");
    const [mrr, setMrr] = useState<number>(0);
    const [dueDay, setDueDay] = useState<number>(1);
    const [dueYear, setDueYear] = useState<number>(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!name || mrr <= 0 || !dueDay || !dueYear) {
            setError("Preencha nome, valor mensal, dia e ano de vencimento");
            return;
        }
        setLoading(true);
        try {
            await createClientWithContract({ name, niche, mrr, dueDay, dueYear });
            setSuccess("Cliente e contrato criados com sucesso");
            setName("");
            setMrr(0);
            setNiche("cassino");
            setDueDay(1);
            setDueYear(new Date().getFullYear());
        } catch (err: any) {
            setError(err?.message || "Falha ao salvar");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold">Adicionar cliente e contrato</h1>
                <div className="flex gap-2">
                    <Link href="/clients/list" className="rounded-xl border border-zinc-800 px-4 py-2 hover:bg-zinc-900">
                        Listar Clientes
                    </Link>
                    <Link href="/clients/import" className="rounded-xl border border-zinc-800 px-4 py-2 hover:bg-zinc-900">
                        Importar Planilha
                    </Link>
                </div>
            </div>
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-800 p-4">
                <div>
                    <label className="block text-sm mb-1">Nome</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-black p-3" required />
                </div>
                <div>
                    <label className="block text-sm mb-1">Nicho</label>
                    <select value={niche} onChange={(e) => setNiche(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-black p-3">
                        <option value="cassino">Cassino</option>
                        <option value="afiliado">Afiliado</option>
                        <option value="expert">Expert</option>
                        <option value="outro">Outro</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm mb-1">Valor mensal (MRR)</label>
                        <input type="number" step="0.01" value={mrr} onChange={(e) => setMrr(Number(e.target.value))} className="w-full rounded-xl border border-zinc-800 bg-black p-3" required />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Dia de vencimento</label>
                        <input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))} className="w-full rounded-xl border border-zinc-800 bg-black p-3" required />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Ano</label>
                        <input type="number" min={2000} max={2100} value={dueYear} onChange={(e) => setDueYear(Number(e.target.value))} className="w-full rounded-xl border border-zinc-800 bg-black p-3" required />
                    </div>
                </div>
                {error ? <p className="text-red-500 text-sm">{error}</p> : null}
                {success ? <p className="text-green-500 text-sm">{success}</p> : null}
                <button disabled={loading} className="rounded-xl bg-orange-500 text-black px-4 py-2 disabled:opacity-50">{loading ? "Salvando..." : "Salvar"}</button>
            </form>
        </div>
    );
}


