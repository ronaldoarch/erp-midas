"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
    const router = useRouter();
    const params = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [isAdmin, setIsAdmin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (password !== confirm) {
            setError("As senhas não coincidem");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, isAdmin }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "Falha ao criar usuário");
            const redirect = params.get("redirect") || "/dashboard";
            router.replace(redirect);
        } catch (err: any) {
            setError(err?.message || "Falha ao criar conta");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-svh flex items-center justify-center bg-black text-white p-4">
            <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-zinc-900 p-6 rounded-2xl shadow">
                <h1 className="text-2xl font-semibold">Criar conta</h1>
                <div className="space-y-2">
                    <label className="block text-sm">E-mail</label>
                    <input
                        type="email"
                        className="w-full rounded-xl border border-zinc-700 bg-black p-3 outline-none focus:ring-2 focus:ring-orange-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm">Senha</label>
                    <input
                        type="password"
                        className="w-full rounded-xl border border-zinc-700 bg-black p-3 outline-none focus:ring-2 focus:ring-orange-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm">Confirmar senha</label>
                    <input
                        type="password"
                        className="w-full rounded-xl border border-zinc-700 bg-black p-3 outline-none focus:ring-2 focus:ring-orange-500"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
                    Tornar este usuário administrador
                </label>
                {error ? <p className="text-red-500 text-sm">{error}</p> : null}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-orange-500 py-3 font-medium text-black hover:bg-orange-400 disabled:opacity-50"
                >
                    {loading ? "Criando..." : "Criar conta"}
                </button>
            </form>
        </div>
    );
}


