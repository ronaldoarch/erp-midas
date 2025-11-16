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
	if (!orgId) return { 
		mrrTotal: 0, 
		totalContractsValue: 0, 
		totalToReceive: 0,
		activeContracts: 0, 
		overdueInvoices: 0, 
		expiringContracts: 0 
	};
	const supabase = createSupabaseServiceRoleClient();

	// Busca TODOS os contratos (ativos e cancelados) para calcular valor total
	const allContractsRes = await supabase.from("contracts").select("mrr,status").eq("org_id", orgId);
	
	// Busca contratos ativos para contar quantidade e calcular valor a receber
	const activeContractsRes = await supabase.from("contracts").select("id,status,mrr").eq("org_id", orgId).eq("status", "active");

	// Busca pagamentos para calcular total faturado
	const paymentsRes = await supabase.from("payments").select("amount").eq("org_id", orgId);
	
	// Busca outras estatísticas (com tratamento de erro se as views não existirem)
	let overdueCount = 0;
	let expiringCount = 0;
	
	try {
		const { count, error } = await supabase
			.from("v_invoices_overdue")
			.select("id", { head: true, count: "exact" })
			.eq("org_id", orgId);
		if (!error && typeof count === "number") overdueCount = count;
	} catch {}
	
	try {
		const { count, error } = await supabase
			.from("v_contracts_expiring")
			.select("id", { head: true, count: "exact" })
			.eq("org_id", orgId);
		if (!error && typeof count === "number") expiringCount = count;
	} catch {}
	
	// Calcula o total faturado somando os pagamentos
	const mrrTotal = (paymentsRes.data as any[])?.reduce((acc, r) => acc + Number(r.amount ?? 0), 0) ?? 0;
	
	// Valor total em contratos = soma de TODOS os contratos (ativos + cancelados)
	const totalContractsValue = (allContractsRes.data as any[])?.reduce((acc, r) => acc + Number(r.mrr ?? 0), 0) ?? 0;
	
	// Valor total a ser recebido = soma apenas dos contratos ATIVOS
	const totalToReceive = (activeContractsRes.data as any[])?.reduce((acc, r) => acc + Number(r.mrr ?? 0), 0) ?? 0;
	
	const activeContractsCount = activeContractsRes.data?.length ?? 0;
	
	return {
		mrrTotal,
		totalContractsValue,
		totalToReceive,
		activeContracts: activeContractsCount,
		overdueInvoices: overdueCount,
		expiringContracts: expiringCount,
	};
}


