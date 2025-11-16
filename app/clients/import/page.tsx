"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { importClientsFromData, type ImportClientRow } from "@/server/actions/import";

export default function ImportClientsPage() {
	const router = useRouter();
	const [file, setFile] = useState<File | null>(null);
	const [url, setUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<any[]>([]);
	const [columns, setColumns] = useState<string[]>([]);
	const [editableData, setEditableData] = useState<ImportClientRow[]>([]);
	const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

	async function handleUpload(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const formData = new FormData();
			if (file) formData.append("file", file);
			if (url) formData.append("url", url);

			const res = await fetch("/api/import", { method: "POST", body: formData });
			const json = await res.json();

			if (!res.ok) throw new Error(json.error || "Erro ao processar planilha");

			setData(json.data);
			setColumns(json.columns);

			const mapping: Record<string, string> = {};
			
			// Mapeamento melhorado - prioriza correspondências exatas
			json.columns.forEach((col: string) => {
				const lower = col.toLowerCase().trim();
				
				// Nome - prioriza correspondências mais específicas
				if (!mapping.name) {
					if (lower === "clientes ativos" || lower.includes("clientes ativos")) {
						mapping.name = col;
					} else if (lower === "cliente" && !lower.includes("valor")) {
						mapping.name = col;
					} else if (lower === "nome" || lower === "name") {
						mapping.name = col;
					}
				}
				
				// Valor
				if (!mapping.value) {
					if (lower === "valor") {
						mapping.value = col;
					} else if (lower.includes("valor") && !mapping.value) {
						mapping.value = col;
					} else if (lower === "mrr" || lower === "value") {
						mapping.value = col;
					}
				}
				
				// Responsável
				if (!mapping.responsible_employee) {
					if (lower === "responsavel" || lower === "responsável") {
						mapping.responsible_employee = col;
					} else if (lower.includes("responsavel") || lower.includes("responsável")) {
						mapping.responsible_employee = col;
					}
				}
				
				// Funcionários
				if (!mapping.employees_count) {
					if (lower.includes("funcionários") || lower.includes("employees")) {
						mapping.employees_count = col;
					}
				}
				
				// Nicho
				if (!mapping.niche) {
					if (lower.includes("nicho")) {
						mapping.niche = col;
					}
				}
			});

			setColumnMapping(mapping);
			
			// Debug no console
			console.log("Colunas detectadas:", json.columns);
			console.log("Mapeamento encontrado:", mapping);
			if (json.data.length > 0) {
				console.log("Primeira linha de dados:", json.data[0]);
			}

			// Função para extrair valor numérico de strings formatadas como "R$ 9.000,00"
			const parseValue = (val: any): number => {
				if (typeof val === "number") return val;
				if (!val || val === "" || val === null) return 0;
				const str = String(val).replace(/[R$.\s]/g, "").replace(",", ".");
				return parseFloat(str) || 0;
			};

			// Mapear dados e filtrar linhas vazias
			const mapped = json.data
				.filter((row: any) => {
					// Verificar se a linha tem pelo menos um nome
					if (mapping.name) {
						const name = String(row[mapping.name] || "").trim();
						return name && name !== "" && name !== "undefined";
					}
					return true;
				})
				.map((row: any) => {
					const name = mapping.name ? String(row[mapping.name] || "").trim() : "";
					const value = mapping.value ? parseValue(row[mapping.value]) : 0;
					const responsible = mapping.responsible_employee ? String(row[mapping.responsible_employee] || "").trim() : "";
					
					return {
						name,
						value,
						responsible_employee: responsible,
						employees_count: mapping.employees_count ? (parseFloat(row[mapping.employees_count] || "0") || 0) : 0,
						dueDay: 1,
						dueYear: new Date().getFullYear(),
						niche: mapping.niche ? (row[mapping.niche] || "cassino") : "cassino",
					};
				});

			console.log("Dados mapeados (primeiros 3):", mapped.slice(0, 3));

			setEditableData(mapped);
		} catch (err: any) {
			setError(err?.message || "Erro ao processar planilha");
		} finally {
			setLoading(false);
		}
	}

	async function handleImport() {
		setError(null);
		setLoading(true);

		try {
			const result = await importClientsFromData(editableData);
			if (result.errors.length > 0) {
				setError(`Importados: ${result.success}. Erros: ${result.errors.join("; ")}`);
			} else {
				router.push("/clients");
			}
		} catch (err: any) {
			setError(err?.message || "Erro ao importar");
		} finally {
			setLoading(false);
		}
	}

	function updateRow(index: number, field: keyof ImportClientRow, value: any) {
		const updated = [...editableData];
		updated[index] = { ...updated[index], [field]: value };
		setEditableData(updated);
	}

	return (
		<div className="max-w-7xl">
			<h1 className="text-2xl font-semibold mb-4">Importar Clientes</h1>

			<form onSubmit={handleUpload} className="mb-6 space-y-4 rounded-2xl border border-zinc-800 p-4">
				<div>
					<label className="block text-sm mb-1">Upload de arquivo (Excel/CSV)</label>
					<input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full rounded-xl border border-zinc-800 bg-black p-3" />
				</div>
				<div className="text-center text-zinc-500">ou</div>
				<div>
					<label className="block text-sm mb-1">URL da planilha</label>
					<input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-zinc-800 bg-black p-3" />
				</div>
				<button type="submit" disabled={loading || (!file && !url)} className="rounded-xl bg-orange-500 text-black px-6 py-3 disabled:opacity-50">
					{loading ? "Processando..." : "Processar Planilha"}
				</button>
			</form>

			{error && <div className="mb-4 p-4 rounded-xl bg-red-900/20 border border-red-800 text-red-400">{error}</div>}

			{columns.length > 0 && (
				<div className="mb-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm">
					<div className="font-semibold mb-2">Colunas detectadas na planilha:</div>
					<div className="flex flex-wrap gap-2">
						{columns.map((col) => (
							<span key={col} className="px-2 py-1 bg-zinc-800 rounded">
								{col}
							</span>
						))}
					</div>
					{Object.keys(columnMapping).length > 0 && (
						<div className="mt-3 font-semibold">Mapeamento:</div>
					)}
					<div className="mt-1 space-y-1">
						{columnMapping.name && <div>Nome → {columnMapping.name}</div>}
						{columnMapping.value && <div>Valor → {columnMapping.value}</div>}
						{columnMapping.responsible_employee && <div>Responsável → {columnMapping.responsible_employee}</div>}
					</div>
				</div>
			)}

			{editableData.length > 0 && (
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h2 className="text-xl font-semibold">Revisar e Editar ({editableData.length} registros)</h2>
						<button onClick={handleImport} disabled={loading} className="rounded-xl bg-orange-500 text-black px-6 py-3 disabled:opacity-50">
							{loading ? "Importando..." : "Importar Todos"}
						</button>
					</div>

					<div className="overflow-x-auto rounded-2xl border border-zinc-800">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="bg-zinc-900">
									<th className="px-4 py-2 text-left">Nome</th>
									<th className="px-4 py-2 text-left">Valor (MRR)</th>
									<th className="px-4 py-2 text-left">Funcionário Responsável</th>
									<th className="px-4 py-2 text-left">Qtd Funcionários</th>
									<th className="px-4 py-2 text-left">Dia Vencimento</th>
									<th className="px-4 py-2 text-left">Ano</th>
									<th className="px-4 py-2 text-left">Nicho</th>
								</tr>
							</thead>
							<tbody>
								{editableData.map((row, idx) => (
									<tr key={idx} className="border-t border-zinc-800">
										<td className="px-4 py-2">
											<input type="text" value={row.name} onChange={(e) => updateRow(idx, "name", e.target.value)} className="w-full rounded border border-zinc-700 bg-black p-2" />
										</td>
										<td className="px-4 py-2">
											<input type="number" step="0.01" value={row.value} onChange={(e) => updateRow(idx, "value", parseFloat(e.target.value) || 0)} className="w-full rounded border border-zinc-700 bg-black p-2" />
										</td>
										<td className="px-4 py-2">
											<input type="text" value={row.responsible_employee || ""} onChange={(e) => updateRow(idx, "responsible_employee", e.target.value)} className="w-full rounded border border-zinc-700 bg-black p-2" />
										</td>
										<td className="px-4 py-2">
											<input type="number" value={row.employees_count || 0} onChange={(e) => updateRow(idx, "employees_count", parseFloat(e.target.value) || 0)} className="w-full rounded border border-zinc-700 bg-black p-2" />
										</td>
										<td className="px-4 py-2">
											<input type="number" min={1} max={31} value={row.dueDay || 1} onChange={(e) => updateRow(idx, "dueDay", parseInt(e.target.value) || 1)} className="w-full rounded border border-zinc-700 bg-black p-2" />
										</td>
										<td className="px-4 py-2">
											<input type="number" min={2000} max={2100} value={row.dueYear || new Date().getFullYear()} onChange={(e) => updateRow(idx, "dueYear", parseInt(e.target.value) || new Date().getFullYear())} className="w-full rounded border border-zinc-700 bg-black p-2" />
										</td>
										<td className="px-4 py-2">
											<select value={row.niche || "cassino"} onChange={(e) => updateRow(idx, "niche", e.target.value)} className="w-full rounded border border-zinc-700 bg-black p-2">
												<option value="cassino">Cassino</option>
												<option value="afiliado">Afiliado</option>
												<option value="expert">Expert</option>
												<option value="outro">Outro</option>
											</select>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}

