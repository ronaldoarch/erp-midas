"use server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

export type ImportClientRow = {
	name: string;
	value: number;
	responsible_employee?: string;
	employees_count?: number;
	dueDay?: number;
	dueYear?: number;
	niche?: string;
	[key: string]: any;
};

export async function importClientsFromData(rows: ImportClientRow[]) {
	let orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || null;
	if (!orgId) throw new Error("org_id não encontrado (configure NEXT_PUBLIC_DEFAULT_ORG_ID no .env.local)");

	const supabase = createSupabaseServiceRoleClient();
	const results = { success: 0, errors: [] as string[] };

	for (const row of rows) {
		try {
			// Validação: nome obrigatório
			if (!row.name || String(row.name).trim() === "") {
				results.errors.push(`${row.name || "Sem nome"}: Nome é obrigatório`);
				continue;
			}
			
			// Valor pode ser 0, mas não pode ser null/undefined/inválido
			const value = Number(row.value);
			if (isNaN(value) || value < 0) {
				results.errors.push(`${row.name}: Valor inválido`);
				continue;
			}
			
			const hasValue = value > 0;
			const dueDay = row.dueDay || 1;
			const dueYear = row.dueYear || new Date().getFullYear();

			const { data: client, error: clientErr } = await supabase
				.from("clients")
				.insert({
					legal_name: row.name.trim(),
					fantasy_name: row.name.trim(),
					org_id: orgId,
					tags: row.niche ? [row.niche] : null,
				})
				.select("id")
				.single();

			if (clientErr) {
				results.errors.push(`${row.name}: ${clientErr.message}`);
				continue;
			}

			// Só cria contrato se tiver valor maior que 0
			if (hasValue) {
				const startDate = new Date();
				const now = new Date();
				const targetMonth = now.getMonth();
				let endDate = new Date(dueYear, targetMonth, Math.min(Math.max(dueDay, 1), 31));
				if (endDate <= now) {
					endDate = new Date(dueYear, targetMonth + 1, Math.min(Math.max(dueDay, 1), 31));
				}

				const { error: contractErr } = await supabase.from("contracts").insert({
					org_id: orgId,
					client_id: client.id,
					title: `Contrato ${row.name}`,
					status: "active",
					billing_cycle: "monthly",
					mrr: value,
					start_date: startDate.toISOString(),
					end_date: endDate.toISOString(),
				});

				if (contractErr) {
					results.errors.push(`${row.name}: ${contractErr.message}`);
					continue;
				}
			}

			results.success++;
		} catch (err: any) {
			const errorMsg = err?.message || err?.toString() || "Erro desconhecido";
			results.errors.push(`${row.name || "Sem nome"}: ${errorMsg}`);
			console.error(`Erro ao importar ${row.name}:`, err);
		}
	}

	return results;
}

