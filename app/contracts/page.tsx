"use client";
import { useState, useEffect } from "react";
import { listContracts } from "@/server/queries/contracts";
import { Currency } from "@/components/ui/currency";
import Link from "next/link";

type Contract = {
	id: string;
	title: string;
	mrr: number;
	status: string;
	start_date: string;
	end_date: string;
	billing_cycle: string;
	clients?: {
		fantasy_name?: string;
		legal_name?: string;
	};
};

export default function ContractsPage() {
	const [contracts, setContracts] = useState<Contract[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [totalValue, setTotalValue] = useState(0);

	useEffect(() => {
		fetchContracts();
	}, []);

	async function fetchContracts() {
		setLoading(true);
		setError(null);
		try {
			const result = await listContracts();
			const contractsData = result.data as Contract[];
			setContracts(contractsData);
			
			// Calcula o valor total de todos os contratos
			const total = contractsData.reduce((sum, contract) => sum + (contract.mrr || 0), 0);
			setTotalValue(total);
		} catch (err: any) {
			setError(err?.message || "Erro ao carregar contratos");
		} finally {
			setLoading(false);
		}
	}

	function getClientName(contract: Contract) {
		if (contract.clients) {
			return contract.clients.fantasy_name || contract.clients.legal_name || "Cliente desconhecido";
		}
		return "Cliente desconhecido";
	}

	return (
		<div className="max-w-7xl">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-semibold">Contratos</h1>
				<Link href="/clients" className="rounded-xl bg-orange-500 text-black px-4 py-2 hover:bg-orange-400">
					Adicionar Contrato
				</Link>
			</div>

			{/* Card com valor total */}
			<div className="mb-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm bg-zinc-900/50">
				<div className="text-sm text-zinc-500">Valor total em contratos</div>
				<div className="text-3xl font-semibold mt-2">
					<Currency value={totalValue} />
				</div>
				<div className="text-xs text-zinc-400 mt-1">Soma de todos os contratos ({contracts.length} contrato{contracts.length !== 1 ? 's' : ''})</div>
			</div>

			{error && (
				<div className="mb-4 p-4 rounded-xl bg-red-900/20 border border-red-800 text-red-400">
					{error}
				</div>
			)}

			{loading ? (
				<div className="text-zinc-500">Carregando...</div>
			) : contracts.length === 0 ? (
				<div className="text-zinc-500">Nenhum contrato encontrado.</div>
			) : (
				<div className="overflow-x-auto rounded-2xl border border-zinc-800">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="bg-zinc-900">
								<th className="px-4 py-2 text-left">Cliente</th>
								<th className="px-4 py-2 text-left">Título</th>
								<th className="px-4 py-2 text-left">Valor (MRR)</th>
								<th className="px-4 py-2 text-left">Ciclo</th>
								<th className="px-4 py-2 text-left">Status</th>
								<th className="px-4 py-2 text-left">Início</th>
								<th className="px-4 py-2 text-left">Término</th>
							</tr>
						</thead>
						<tbody>
							{contracts.map((contract) => (
								<tr key={contract.id} className="border-t border-zinc-800">
									<td className="px-4 py-2">{getClientName(contract)}</td>
									<td className="px-4 py-2">{contract.title || "-"}</td>
									<td className="px-4 py-2">
										<Currency value={contract.mrr || 0} />
									</td>
									<td className="px-4 py-2">
										{contract.billing_cycle === "monthly" ? "Mensal" : contract.billing_cycle || "-"}
									</td>
									<td className="px-4 py-2">
										{contract.status === "active" ? (
											<span className="px-2 py-1 rounded bg-green-900/30 text-green-400">
												Ativo
											</span>
										) : (
											<span className="px-2 py-1 rounded bg-red-900/30 text-red-400">
												Cancelado
											</span>
										)}
									</td>
									<td className="px-4 py-2">
										{contract.start_date
											? new Date(contract.start_date).toLocaleDateString("pt-BR")
											: "-"}
									</td>
									<td className="px-4 py-2">
										{contract.end_date
											? new Date(contract.end_date).toLocaleDateString("pt-BR")
											: "-"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
