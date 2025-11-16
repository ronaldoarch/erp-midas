"use server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getUserOrgId } from "../utils/auth";

export async function getDashboardStats() {
	let orgId: string | null = null;
	try {
		orgId = await getUserOrgId();
	} catch {}
	if (!orgId) {
		orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || null;
	}
	if (!orgId) return { mrrTotal: 0, activeContracts: 0, overdueInvoices: 0, expiringContracts: 0 };
	const supabase = createSupabaseServiceRoleClient();
	// Busca contratos ativos para calcular MRR
	const contractsRes = await supabase.from("contracts").select("mrr,status").eq("org_id", orgId).eq("status", "active");
	
	// Busca outras estatísticas (com tratamento de erro se as views não existirem)
	let overdueRes = { count: 0, error: null };
	let expiringRes = { count: 0, error: null };
	
	try {
		const overdueQuery = await supabase.from("v_invoices_overdue").select("id", { head: true, count: "exact" }).eq("org_id", orgId);
		if (!overdueQuery.error) overdueRes = overdueQuery;
	} catch {}
	
	try {
		const expiringQuery = await supabase.from("v_contracts_expiring").select("id", { head: true, count: "exact" }).eq("org_id", orgId);
		if (!expiringQuery.error) expiringRes = expiringQuery;
	} catch {}
	
	// Calcula o MRR total somando os valores dos contratos ativos
	const mrrTotal = (contractsRes.data as any[])?.reduce((acc, r) => acc + Number(r.mrr ?? 0), 0) ?? 0;
	const activeContractsCount = contractsRes.data?.length ?? 0;
	
	return {
		mrrTotal,
		activeContracts: activeContractsCount,
		overdueInvoices: overdueRes.count ?? 0,
		expiringContracts: expiringRes.count ?? 0,
	};
}


