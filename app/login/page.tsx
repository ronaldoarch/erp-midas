"use client";
import { Suspense, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
	const router = useRouter();
	const params = useSearchParams();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const supabase = createSupabaseBrowserClient();
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) throw error;
			const redirect = params.get("redirect") || "/dashboard";
			router.replace(redirect);
		} catch (err: any) {
			setError(err?.message || "Falha no login");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen grid place-items-center p-6">
			<form
				onSubmit={onSubmit}
				className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm bg-white dark:bg-black"
			>
				<h1 className="text-2xl font-semibold mb-4">Entrar</h1>
				<div className="space-y-3">
					<input
						type="email"
						required
						placeholder="E-mail"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black py-2 px-3"
					/>
					<input
						type="password"
						required
						placeholder="Senha"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black py-2 px-3"
					/>
					{error ? <p className="text-red-500 text-sm">{error}</p> : null}
				</div>
				<button
					disabled={loading}
					className="mt-4 w-full rounded-2xl bg-orange-500 text-white py-2 disabled:opacity-50"
				>
					{loading ? "Entrando..." : "Entrar"}
				</button>
			</form>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen grid place-items-center p-6">
					<div className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm bg-white dark:bg-black">
						<h1 className="text-2xl font-semibold mb-4">Entrar</h1>
						<p className="text-sm text-zinc-500">Carregando...</p>
					</div>
				</div>
			}
		>
			<LoginForm />
		</Suspense>
	);
}
