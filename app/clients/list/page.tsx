"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toggleClientStatus } from "@/server/actions/clients";

type ClientWithContract = {
	id: string;
	fantasy_name: string;
	legal_name: string;
	contracts: Array<{
		id: string;
		status: string;
		mrr: number;
		end_date: string;
	}>;
};

export default function ClientsListPage() {
	const [clients, setClients] = useState<ClientWithContract[]>([]);
	const [loading, setLoading] = useState(true);
	const [togglingId, setTogglingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
	const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

	useEffect(() => {
		fetchClients();
	}, [filterMonth, filterYear]);

	async function fetchClients() {
		setLoading(true);
		try {
			const res = await fetch(`/api/clients?month=${filterMonth}&year=${filterYear}`);
			const data = await res.json();
			if (res.ok) {
				setClients(data);
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	async function handleToggleStatus(clientId: string, contractId: string, currentStatus: string) {
		const isActive = currentStatus === "active";
		setError(null);
		setTogglingId(contractId);
		try {
			const result = await toggleClientStatus(clientId, contractId, !isActive);
			if (result && result.success) {
				await fetchClients();
			} else {
				setError("Erro ao alterar status do contrato");
			}
		} catch (err: any) {
			console.error("Erro ao alterar status:", err);
			setError(err?.message || "Erro ao alterar status do contrato");
		} finally {
			setTogglingId(null);
		}
	}

	return (
		<div className="max-w-7xl">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-semibold">Lista de Clientes</h1>
				<Link href="/clients" className="rounded-xl bg-orange-500 text-black px-4 py-2 hover:bg-orange-400">
					Adicionar Cliente
				</Link>
			</div>

			{error && (
				<div className="mb-4 p-4 rounded-xl bg-red-900/20 border border-red-800 text-red-400">
					{error}
				</div>
			)}

			<div className="mb-4 flex gap-4 items-center">
				<label className="text-sm">Filtro por Mês:</label>
				<select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="rounded-xl border border-zinc-800 bg-black p-2">
					{Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
						<option key={month} value={month}>
							{new Date(2024, month - 1).toLocaleString("pt-BR", { month: "long" })}
						</option>
					))}
				</select>
				<input type="number" min={2000} max={2100} value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="rounded-xl border border-zinc-800 bg-black p-2 w-24" />
			</div>

			{loading ? (
				<div className="text-zinc-500">Carregando...</div>
			) : (
				<div className="overflow-x-auto rounded-2xl border border-zinc-800">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="bg-zinc-900">
								<th className="px-4 py-2 text-left">Nome</th>
								<th className="px-4 py-2 text-left">Valor (MRR)</th>
								<th className="px-4 py-2 text-left">Status</th>
								<th className="px-4 py-2 text-left">Vencimento</th>
								<th className="px-4 py-2 text-left">Ações</th>
							</tr>
						</thead>
						<tbody>
							{clients.map((client) => {
								const contract = client.contracts[0];
								if (!contract) return null;
								return (
									<tr key={client.id} className="border-t border-zinc-800">
										<td className="px-4 py-2">{client.fantasy_name || client.legal_name}</td>
										<td className="px-4 py-2">R$ {contract.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
										<td className="px-4 py-2">
											<span className={`px-2 py-1 rounded ${contract.status === "active" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
												{contract.status === "active" ? "Ativo" : "Desligado"}
											</span>
										</td>
										<td className="px-4 py-2">{new Date(contract.end_date).toLocaleDateString("pt-BR")}</td>
										<td className="px-4 py-2">
											<button
												onClick={() => handleToggleStatus(client.id, contract.id, contract.status)}
												disabled={togglingId === contract.id}
												className={`px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${contract.status === "active" ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-green-900/30 text-green-400 hover:bg-green-900/50"}`}
											>
												{togglingId === contract.id ? "Atualizando..." : contract.status === "active" ? "Desligar" : "Ativar"}
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

