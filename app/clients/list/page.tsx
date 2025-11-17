"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toggleClientStatus, updateClient, updateContract } from "@/server/actions/clients";

type ClientWithContract = {
	id: string;
	fantasy_name: string;
	legal_name: string;
	phone?: string;
	responsible_employee?: string;
	contracts: Array<{
		id: string;
		status: string;
		mrr: number;
		end_date: string;
		title?: string;
	}>;
};

export default function ClientsListPage() {
	const [clients, setClients] = useState<ClientWithContract[]>([]);
	const [loading, setLoading] = useState(true);
	const [togglingId, setTogglingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [editingClient, setEditingClient] = useState<ClientWithContract | null>(null);
	const [editForm, setEditForm] = useState({
		fantasy_name: "",
		legal_name: "",
		phone: "",
		responsible_employee: "",
		mrr: 0,
		end_date: "",
		title: "",
	});
	const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
	const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

	useEffect(() => {
		fetchClients();
	}, [filterMonth, filterYear]);

	async function fetchClients(forceRefresh = false) {
		setLoading(true);
		try {
			// Adiciona timestamp para evitar cache
			const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : '';
			const res = await fetch(`/api/clients?month=${filterMonth}&year=${filterYear}${cacheBuster}`, {
				cache: forceRefresh ? 'no-store' : 'default',
			});
			const data = await res.json();
			if (res.ok) {
				console.log('Clientes carregados:', data.length);
				setClients(data);
			} else {
				console.error('Erro ao carregar clientes:', data);
			}
		} catch (err) {
			console.error('Erro ao buscar clientes:', err);
		} finally {
			setLoading(false);
		}
	}

	async function handleToggleStatus(clientId: string, contractId: string, currentStatus: string) {
		const isActive = currentStatus === "active";
		setError(null);
		setTogglingId(contractId);
		try {
			console.log(`Tentando ${isActive ? "desativar" : "ativar"} contrato ${contractId}`);
			const result = await toggleClientStatus(clientId, contractId, !isActive);
			console.log("Resultado da atualização:", result);
			if (result && result.success) {
				const newStatus = isActive ? "cancelled" : "active";
				console.log('Status atualizado com sucesso. Novo status:', newStatus);
				console.log('Dados retornados do servidor:', result.data);
				
				// Atualiza o estado local imediatamente para feedback visual
				setClients((prevClients) => {
					const updated = prevClients.map((client) => {
						if (client.id === clientId) {
							const updatedContracts = client.contracts.map((contract) =>
								contract.id === contractId
									? { ...contract, status: newStatus }
									: contract
							);
							console.log(`Contrato ${contractId} atualizado no estado local. Novo status: ${newStatus}`);
							return {
								...client,
								contracts: updatedContracts,
							};
						}
						return client;
					});
					console.log('Estado atualizado. Total de clientes:', updated.length);
					return updated;
				});
				
				setTogglingId(null);
				
				// NÃO recarrega do servidor imediatamente - deixa o estado local
				// O usuário pode recarregar manualmente se necessário
				// Isso evita que dados antigos do servidor sobrescrevam a atualização
			} else {
				setError("Erro ao alterar status do contrato - resposta inválida");
				setTogglingId(null);
			}
		} catch (err: any) {
			console.error("Erro ao alterar status:", err);
			setError(err?.message || "Erro ao alterar status do contrato");
			setTogglingId(null);
		}
	}

	function handleEditClick(client: ClientWithContract) {
		const contract = client.contracts[0];
		setEditingClient(client);
		setEditForm({
			fantasy_name: client.fantasy_name || "",
			legal_name: client.legal_name || "",
			phone: client.phone || "",
			responsible_employee: client.responsible_employee || "",
			mrr: contract?.mrr || 0,
			end_date: contract?.end_date ? new Date(contract.end_date).toISOString().split("T")[0] : "",
			title: contract?.title || "",
		});
	}

	function handleCloseEdit() {
		setEditingClient(null);
		setEditForm({
			fantasy_name: "",
			legal_name: "",
			phone: "",
			responsible_employee: "",
			mrr: 0,
			end_date: "",
			title: "",
		});
	}

	async function handleSaveEdit() {
		if (!editingClient) return;
		setError(null);
		try {
			const contract = editingClient.contracts[0];
			
			// Atualiza cliente
			await updateClient(editingClient.id, {
				fantasy_name: editForm.fantasy_name,
				legal_name: editForm.legal_name,
				phone: editForm.phone || undefined,
				responsible_employee: editForm.responsible_employee || undefined,
			});

			// Atualiza contrato
			if (contract) {
				await updateContract(contract.id, {
					title: editForm.title || undefined,
					mrr: editForm.mrr || undefined,
					end_date: editForm.end_date ? new Date(editForm.end_date).toISOString() : undefined,
				});
			}

			handleCloseEdit();
			await fetchClients();
		} catch (err: any) {
			setError(err?.message || "Erro ao salvar alterações");
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
											<div className="flex gap-2">
												<button
													onClick={() => handleToggleStatus(client.id, contract.id, contract.status)}
													disabled={togglingId === contract.id}
													className={`px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed ${contract.status === "active" ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-green-900/30 text-green-400 hover:bg-green-900/50"}`}
												>
													{togglingId === contract.id ? "Atualizando..." : contract.status === "active" ? "Desligar" : "Ativar"}
												</button>
												<button
													onClick={() => handleEditClick(client)}
													className="px-3 py-1 rounded text-sm bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
												>
													Editar
												</button>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{/* Modal de Edição */}
			{editingClient && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-black border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<h2 className="text-xl font-semibold mb-4">Editar Cliente e Contrato</h2>
						
						<div className="space-y-4">
							<div>
								<label className="block text-sm mb-1">Nome Fantasia</label>
								<input
									type="text"
									value={editForm.fantasy_name}
									onChange={(e) => setEditForm({ ...editForm, fantasy_name: e.target.value })}
									className="w-full rounded-xl border border-zinc-800 bg-black p-3"
								/>
							</div>
							<div>
								<label className="block text-sm mb-1">Razão Social</label>
								<input
									type="text"
									value={editForm.legal_name}
									onChange={(e) => setEditForm({ ...editForm, legal_name: e.target.value })}
									className="w-full rounded-xl border border-zinc-800 bg-black p-3"
								/>
							</div>
							<div>
								<label className="block text-sm mb-1">Telefone</label>
								<input
									type="text"
									value={editForm.phone}
									onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
									placeholder="(00) 00000-0000"
									className="w-full rounded-xl border border-zinc-800 bg-black p-3"
								/>
							</div>
							<div>
								<label className="block text-sm mb-1">Funcionário Responsável</label>
								<input
									type="text"
									value={editForm.responsible_employee}
									onChange={(e) => setEditForm({ ...editForm, responsible_employee: e.target.value })}
									className="w-full rounded-xl border border-zinc-800 bg-black p-3"
								/>
							</div>
							<div>
								<label className="block text-sm mb-1">Título do Contrato</label>
								<input
									type="text"
									value={editForm.title}
									onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
									className="w-full rounded-xl border border-zinc-800 bg-black p-3"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm mb-1">Valor Mensal (MRR)</label>
									<input
										type="number"
										step="0.01"
										value={editForm.mrr}
										onChange={(e) => setEditForm({ ...editForm, mrr: Number(e.target.value) })}
										className="w-full rounded-xl border border-zinc-800 bg-black p-3"
									/>
								</div>
								<div>
									<label className="block text-sm mb-1">Data de Vencimento</label>
									<input
										type="date"
										value={editForm.end_date}
										onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
										className="w-full rounded-xl border border-zinc-800 bg-black p-3"
									/>
								</div>
							</div>
						</div>

						<div className="flex gap-2 mt-6">
							<button
								onClick={handleSaveEdit}
								className="flex-1 rounded-xl bg-orange-500 text-black px-4 py-2 hover:bg-orange-400"
							>
								Salvar
							</button>
							<button
								onClick={handleCloseEdit}
								className="flex-1 rounded-xl border border-zinc-800 px-4 py-2 hover:bg-zinc-900"
							>
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

